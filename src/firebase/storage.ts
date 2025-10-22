
'use client';

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, type StorageReference } from 'firebase/storage';
import { initializeFirebase } from './index';

const { firebaseApp } = initializeFirebase();
const storage = getStorage(firebaseApp);

export const uploadFile = async (file: File, path: string) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return { downloadURL, path };
};

export const deleteFile = async (path: string) => {
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // It's not a critical error if the file doesn't exist.
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting file from storage:", error);
      // You might want to log this error to a monitoring service
    }
  }
};

export const getStorageRef = (path: string): StorageReference => {
    return ref(storage, path);
}
