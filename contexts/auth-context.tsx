
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
        // This can happen if user is created in Auth but not in Firestore yet
        // Let's not set user to null here, maybe the creation is in progress
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, firestore]);
  
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest, including setting loading to false
      return { success: true };
    } catch (error: any) {
      setIsLoading(false);
      let errorMessage = 'Произошла неизвестная ошибка.';
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Неверный email или пароль.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Пользователь с таким email не найден.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Неверный пароль.';
          break;
        default:
          errorMessage = 'Ошибка входа. Пожалуйста, попробуйте еще раз.';
          break;
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle setting user state to null
    } catch (error) {
    }
  };
  
  const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const photoURL = `https://picsum.photos/seed/${newUser.uid}/100/100`;
      
      // We update the auth profile first
      await updateProfile(newUser, { 
        displayName: name,
        photoURL: photoURL
      });

      // Then create the user document in Firestore
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
      
      // onAuthStateChanged will be triggered automatically and will handle loading the new user data.
      // We don't need to manually set the user or loading state here.
      return { success: true };

    } catch (error: any) {
       let errorMessage = 'Произошла неизвестная ошибка.';
       if (error.name === 'FirestoreError' || error.code?.startsWith('permission-denied')) {
         const userDocRef = doc(firestore, 'unknown-uid');
         const permissionError = new FirestorePermissionError({
           path: userDocRef.path,
           operation: 'create',
         });
         errorEmitter.emit('permission-error', permissionError);
         errorMessage = 'Ошибка сохранения данных пользователя.';
       } else {
         switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'Пользователь с таким email уже существует.';
              break;
            case 'auth/weak-password':
              errorMessage = 'Пароль слишком слабый. Он должен содержать не менее 6 символов.';
              break;
            default:
              errorMessage = 'Ошибка регистрации. Пожалуйста, попробуйте еще раз.';
              break;
         }
       }
       setIsLoading(false);
       return { success: false, error: errorMessage };
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
