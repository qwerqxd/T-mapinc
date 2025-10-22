'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type CollectionReference, type DocumentData } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface UseCollectionOptions {
    // Future options can be added here
}

export function useCollection<T extends DocumentData>(
  ref: CollectionReference<T> | Query<T> | null,
  options?: UseCollectionOptions
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Using JSON.stringify to create a stable dependency for the useEffect hook.
    // This prevents re-renders if the ref object is recreated but is logically the same.
    const refPath = ref ? ('path' in ref ? ref.path : 'query') : null;

    if (!ref) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as T));
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: refPath || 'unknown',
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref ? ('path' in ref ? ref.path : JSON.stringify(ref)) : null]);

  return { data, loading, error };
}
