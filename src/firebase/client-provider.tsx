'use client';

import { ReactNode, useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [firebase, setFirebase] = useState<{
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);

  useEffect(() => {
    // Firebase should only be initialized on the client.
    const { firebaseApp, auth, firestore } = initializeFirebase();
    setFirebase({ firebaseApp, auth, firestore });
  }, []);

  if (!firebase) {
    // You can show a loading state here if needed
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.firebaseApp}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
