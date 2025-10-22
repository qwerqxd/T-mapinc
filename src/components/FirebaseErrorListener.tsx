
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This component is responsible for listening to Firestore permission errors
// and throwing them in a way that the Next.js development overlay can catch
// and display them. This is for development purposes only.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // Throw the error so that the Next.js dev overlay can pick it up.
      // We need to do this in a timeout to escape the event handler's context.
      setTimeout(() => {
        throw error;
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null;
}
