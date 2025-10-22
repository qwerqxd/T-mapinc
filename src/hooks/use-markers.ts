
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, type CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { MarkerData, Review, ReviewMedia } from '@/lib/types';
import { uploadFile, deleteFile } from '@/firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export function useMarkers() {
    const firestore = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: markers, loading: markersLoading, error: markersError } = useCollection<MarkerData>(firestore ? collection(firestore, 'markers') as CollectionReference<MarkerData> : null);
    const { data: reviews, loading: reviewsLoading, error: reviewsError } = useCollection<Review>(firestore ? collection(firestore, 'reviews') as CollectionReference<Review> : null);

    const handleFileUploads = async (files: File[]): Promise<ReviewMedia[]> => {
        if (!user) return [];

        const uploadPromises = files.map(async (file) => {
            const fileId = uuidv4();
            const fileExtension = file.name.split('.').pop();
            const storagePath = `reviews/${user.uid}/${fileId}.${fileExtension}`;
            const { downloadURL } = await uploadFile(file, storagePath);
            return {
                url: downloadURL,
                type: file.type.startsWith('image') ? 'image' : 'video',
                storagePath,
            } as ReviewMedia;
        });

        return Promise.all(uploadPromises);
    };

    const addReview = async (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => {
        if (!user || !firestore) return;
        
        const { media: files = [], ...restOfReviewData } = reviewData;
        const uploadedMedia = await handleFileUploads(files);

        const newReview = {
            ...restOfReviewData,
            markerId,
            authorId: user.uid,
            authorName: user.name || 'Анонимный пользователь',
            authorAvatarUrl: user.avatarUrl || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            media: uploadedMedia,
        };

        const reviewsCollection = collection(firestore, 'reviews');
        try {
            await addDoc(reviewsCollection, newReview);
            toast({ title: 'Успех', description: 'Ваш отзыв был отправлен.' });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: reviewsCollection.path,
                operation: 'create',
                requestResourceData: newReview,
            });
            errorEmitter.emit('permission-error', permissionError);
            // If upload was successful but firestore failed, delete uploaded files
            uploadedMedia.forEach(media => media.storagePath && deleteFile(media.storagePath));
        }
    };

    const addMarkerWithReview = async (coords: { lat: number; lng: number }, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { name?: string, media?: File[] }) => {
        if (!user || !firestore) return;

        const markerName = reviewData.name;
        if (!markerName) {
             toast({ title: 'Ошибка', description: 'Необходимо название для новой метки.', variant: 'destructive' });
             return null;
        }

        try {
            const markersCollection = collection(firestore, 'markers');
            const newMarkerRef = doc(markersCollection);
            
            const newMarker: Omit<MarkerData, 'id'> = {
                createdBy: user.uid,
                lat: coords.lat,
                lng: coords.lng,
                name: markerName,
            };

            await setDoc(newMarkerRef, newMarker);

            const { name, ...reviewDataForDb } = reviewData;
            await addReview(newMarkerRef.id, reviewDataForDb);
            
            toast({ title: 'Успех', description: 'Новая метка и ваш отзыв были добавлены.' });
            return newMarkerRef.id;
        } catch (error: any) {
            console.error("Error creating marker with review:", error);
            const permissionError = new FirestorePermissionError({
              path: `markers/[new_marker]`,
              operation: 'create',
              requestResourceData: { coords, reviewData },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        return null;
    };
    
    const updateReview = async (reviewToUpdate: Review, updatedData: { text: string; rating: number; media?: File[] }) => {
        if (!user || !firestore) return;
        const reviewRef = doc(firestore, 'reviews', reviewToUpdate.id);
        
        const { media: newFiles = [], ...restOfData } = updatedData;
        const newUploadedMedia = await handleFileUploads(newFiles);

        const dataToUpdate = {
            ...restOfData,
            updatedAt: serverTimestamp(),
            media: [...(reviewToUpdate.media || []), ...newUploadedMedia]
        };

        try {
            await updateDoc(reviewRef, dataToUpdate as any);
            toast({ title: 'Успех', description: 'Ваш отзыв был обновлен.' });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
             // If upload was successful but firestore failed, delete newly uploaded files
            newUploadedMedia.forEach(media => media.storagePath && deleteFile(media.storagePath));
        }
    };

    const deleteReview = async (reviewToDelete: Review) => {
        if (!user || !firestore) return;
        
        const reviewRef = doc(firestore, 'reviews', reviewToDelete.id);

        try {
            await deleteDoc(reviewRef);

            // Delete associated media from storage
            if (reviewToDelete.media) {
                const deletePromises = reviewToDelete.media.map(media => {
                    if (media.storagePath) {
                        return deleteFile(media.storagePath);
                    }
                    return Promise.resolve();
                });
                await Promise.all(deletePromises);
            }

            toast({ title: 'Успех', description: 'Ваш отзыв был удален.' });

            const otherReviewsForMarker = reviews?.filter(
                (r) => r.markerId === reviewToDelete.markerId && r.id !== reviewToDelete.id
            );

            if (otherReviewsForMarker && otherReviewsForMarker.length === 0) {
               await deleteMarker(reviewToDelete.markerId);
            }
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const deleteMarker = async (markerId: string) => {
        if(!firestore) return;
        const markerRef = doc(firestore, 'markers', markerId);
        try {
            await deleteDoc(markerRef);
            toast({ title: 'Успех', description: 'Последний отзыв и метка были удалены.' });
        } catch(markerError) {
           const permissionError = new FirestorePermissionError({
              path: markerRef.path,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
    }

    return {
        markers: markers || [],
        reviews: reviews || [],
        loading: markersLoading || reviewsLoading,
        error: markersError || reviewsError,
        addReview,
        addMarkerWithReview,
        updateReview,
        deleteReview,
        deleteMarker,
    };
}
