'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useFirebase, useFirestore } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { firebaseApp } = useFirebase();
  const auth = getAuth(firebaseApp);
  const firestore = useFirestore();

  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (fbUser: FirebaseUser) => {
    const userDocRef = doc(firestore, 'users', fbUser.uid);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser(userDocSnap.data() as User);
      } else {
        console.log(`User document for ${fbUser.uid} not found. This may be expected during registration.`);
        setUser(null);
      }
    } catch (error) {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'get',
      });
      errorEmitter.emit('permission-error', permissionError);
      setUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        await fetchUserData(fbUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, firestore]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
      return true;
    } catch (error: any) {
      console.error('Login error:', error.message);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user state to null
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const photoURL = `https://picsum.photos/seed/${newUser.uid}/100/100`;
      
      await updateProfile(newUser, { 
        displayName: name,
        photoURL: photoURL
      });

      const userDocRef = doc(firestore, 'users', newUser.uid);
      const userData: User = {
          uid: newUser.uid,
          name: name,
          email: email,
          avatarUrl: photoURL,
          role: 'user',
          createdAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userData);
      
      // We set the user manually here to avoid waiting for onAuthStateChanged to refetch
      // setUser(userData); this will cause a mismatch with server generated timestamp
      // Let onAuthStateChanged handle fetching the complete user data
      
      return true;

    } catch (error: any) {
       // Check if it's a Firestore error
       if (error.name === 'FirestoreError' || error.code?.startsWith('permission-denied')) {
         const userDocRef = doc(firestore, error.uid || 'unknown-uid'); // Try to get UID if possible
         const permissionError = new FirestorePermissionError({
           path: userDocRef.path,
           operation: 'create',
           // requestResourceData is tricky here, but we can approximate it.
         });
         errorEmitter.emit('permission-error', permissionError);
       } else {
         // Handle auth-specific errors
         console.error("Registration auth error:", error.message);
       }
       setIsLoading(false);
       return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
