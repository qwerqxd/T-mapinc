// This file is the "barrel" file for all Firebase related functionality.
// It's the public API for the rest of the app to interact with Firebase.

// We will be using the client-side SDKs for all Firebase functionality.
// We are not using the Firebase Admin SDK in this project.
'use client';
import {
  initializeApp,
  getApp,
  getApps,
  FirebaseApp,
  FirebaseOptions,
} from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// These are the core Firebase hooks and providers that the rest of the app will use.
export * from './client-provider';
export * from './provider';

// These are the hooks for interacting with Firestore and Auth.
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

import { firebaseConfig } from './config';

// The initialized firebase app object.
// This is a singleton, so it will only be created once.
let firebaseApp: FirebaseApp;

/**
 * Initializes the Firebase app if it hasn't been initialized yet.
 * @returns An object containing the initialized Firebase app, Auth, and Firestore instances.
 */
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (!firebaseApp) {
    // If there are no apps initialized, initialize a new one.
    if (!getApps().length) {
      firebaseApp = initializeApp(firebaseConfig as FirebaseOptions);
    } else {
      // If there are already apps initialized, get the default one.
      firebaseApp = getApp();
    }
  }

  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}
