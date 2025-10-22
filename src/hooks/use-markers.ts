
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


async function processMedia(userId: string, markerId: string, mediaItems: ReviewMedia[]): Promise<Omit<ReviewMedia, 'file'>[]> {
    if (!mediaItems) return [];
    const uploadPromises = mediaItems.map(async (item) => {
        // If there's a file object, it means it's a new upload.
        if (item.file && !item.storagePath) {
            const storagePath = `reviews/${userId}/${markerId}/${uuidv4()}-${item.file.name}`;
            const { downloadURL } = await uploadFile(item.file, storagePath);
            return {
                type: item.type,
                url: downloadURL,
                storagePath: storagePath,
            };
        }
        // If there's no file, it's an existing media item. Just return its data.
        const { file, ...rest } = item;
        return rest;
    });
    return Promise.all(uploadPromises);
}

export function useMarkers() {
    const firestore = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: markers, loading: markersLoading, error: markersError } = useCollection<MarkerData>(firestore ? collection(firestore, 'markers') as CollectionReference<MarkerData> : null);
    const { data: reviews, loading: reviewsLoading, error: reviewsError } = useCollection<Review>(firestore ? collection(firestore, 'reviews') as CollectionReference<Review> : null);

    const addReview = async (markerId: string, reviewData: { text: string; rating: number; media: ReviewMedia[] }) => {
        if (!user || !firestore) return;

        const processedMedia = await processMedia(user.uid, markerId, reviewData.media || []);

        const newReview: Omit<Review, 'id'> = {
            ...reviewData,
            media: processedMedia,
            markerId,
            authorId: user.uid,
            authorName: user.name || 'Анонимный пользователь',
            authorAvatarUrl: user.avatarUrl || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const reviewsCollection = collection(firestore, 'reviews');
        addDoc(reviewsCollection, newReview)
          .then(() => {
              toast({ title: 'Успех', description: 'Ваш отзыв был отправлен.' });
          })
          .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: reviewsCollection.path,
                operation: 'create',
                requestResourceData: newReview,
            });
            errorEmitter.emit('permission-error', permissionError);
          });
    };

    const addMarkerWithReview = async (coords: { lat: number; lng: number }, data: {name: string, text: string, rating: number, media: ReviewMedia[]}) => {
        if (!user || !firestore) return;

        const { name: markerName, ...reviewData } = data;

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

            await addReview(newMarkerRef.id, reviewData);
            
            toast({ title: 'Успех', description: 'Новая метка и ваш отзыв были добавлены.' });
            return newMarkerRef.id;
        } catch (error: any) {
            console.error("Error creating marker with review:", error);
            const permissionError = new FirestorePermissionError({
              path: `markers/[new_marker]`,
              operation: 'create',
              requestResourceData: { coords, reviewData: data },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        return null;
    };
    
    const updateReview = async (reviewToUpdate: Review, updatedData: { text: string; rating: number; media: ReviewMedia[] }) => {
        if (!user || !firestore) return;
        const reviewRef = doc(firestore, 'reviews', reviewToUpdate.id);
        
        const processedMedia = await processMedia(user.uid, reviewToUpdate.markerId, updatedData.media || []);

        const dataToUpdate: any = {
            text: updatedData.text,
            rating: updatedData.rating,
            media: processedMedia,
            updatedAt: serverTimestamp(),
        };

        const oldMedia = reviewToUpdate.media || [];
        const newMediaPaths = new Set(processedMedia.map(m => m.storagePath).filter(Boolean));
        const mediaToDelete = oldMedia.filter(m => m.storagePath && !newMediaPaths.has(m.storagePath));
        
        await Promise.all(mediaToDelete.map(m => m.storagePath && deleteFile(m.storagePath)));

        updateDoc(reviewRef, dataToUpdate)
            .then(() => {
                toast({ title: 'Успех', description: 'Ваш отзыв был обновлен.' });
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: reviewRef.path,
                    operation: 'update',
                    requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const deleteReview = async (reviewToDelete: Review) => {
        if (!user || !firestore) return;
        
        const reviewRef = doc(firestore, 'reviews', reviewToDelete.id);

        deleteDoc(reviewRef)
            .then(async () => {
                toast({ title: 'Успех', description: 'Ваш отзыв был удален.' });
                
                if (reviewToDelete.media) {
                    await Promise.all(reviewToDelete.media.map(m => m.storagePath && deleteFile(m.storagePath)));
                }

                const otherReviewsForMarker = reviews?.filter(
                    (r) => r.markerId === reviewToDelete.markerId && r.id !== reviewToDelete.id
                );

                if (otherReviewsForMarker && otherReviewsForMarker.length === 0) {
                   await deleteMarker(reviewToDelete.markerId);
                }
            })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: reviewRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    };

    const deleteMarker = async (markerId: string) => {
        if(!firestore) return;
        const markerRef = doc(firestore, 'markers', markerId);
        deleteDoc(markerRef)
            .then(() => {
                toast({ title: 'Успех', description: 'Последний отзыв и метка были удалены.' });
            })
            .catch((markerError) => {
               const permissionError = new FirestorePermissionError({
                  path: markerRef.path,
                  operation: 'delete',
              });
              errorEmitter.emit('permission-error', permissionError);
            });
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
