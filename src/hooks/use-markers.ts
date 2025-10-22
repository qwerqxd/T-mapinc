
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, type CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { MarkerData, Review, ReviewMedia } from '@/lib/types';
import { getLocationFromCoords } from '@/ai/flows/get-location-from-coords-flow';

export function useMarkers() {
    const firestore = useFirestore();
    const { user } = useAuth();
    const { toast } = useToast();

    const { data: markers } = useCollection<MarkerData>(firestore ? collection(firestore, 'markers') as CollectionReference<MarkerData> : null);
    const { data: reviews } = useCollection<Review>(firestore ? collection(firestore, 'reviews') as CollectionReference<Review> : null);

    const addReview = async (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
        if (!user || !firestore) return;

        const newReview = {
            ...reviewData,
            markerId,
            authorId: user.uid,
            authorName: user.name || 'Анонимный пользователь',
            authorAvatarUrl: user.avatarUrl || null,
            createdAt: serverTimestamp(),
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
        }
    };

    const addMarkerWithReview = async (coords: { lat: number; lng: number }, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
        if (!user || !firestore) return;

        try {
            const location = await getLocationFromCoords({ lat: coords.lat, lng: coords.lng });

            const markersCollection = collection(firestore, 'markers');
            const newMarkerRef = doc(markersCollection);
            
            const newMarker: Omit<MarkerData, 'id'> = {
                createdBy: user.uid,
                lat: coords.lat,
                lng: coords.lng,
                name: location.name,
            };

            await setDoc(newMarkerRef, newMarker);

            await addReview(newMarkerRef.id, reviewData);
            
            toast({ title: 'Успех', description: 'Новая метка и ваш отзыв были добавлены.' });
            return newMarkerRef.id;
        } catch (error: any) {
            console.error("Error creating marker with review:", error);
            toast({
                title: 'Ошибка',
                description: error.message || 'Не удалось создать метку и отзыв.',
                variant: 'destructive',
            });
        }
        return null;
    };
    
    const updateReview = async (reviewToUpdate: Review, updatedData: { text: string; rating: number; media?: ReviewMedia[] }) => {
        if (!user || !firestore) return;
        const reviewRef = doc(firestore, 'reviews', reviewToUpdate.id);
        
        const dataToUpdate = {
            ...updatedData,
            updatedAt: serverTimestamp(),
        };

        try {
            await updateDoc(reviewRef, dataToUpdate);
            toast({ title: 'Успех', description: 'Ваш отзыв был обновлен.' });
        } catch (serverError) {
            const permissionError = new FirestorePermissionError({
                path: reviewRef.path,
                operation: 'update',
                requestResourceData: dataToUpdate,
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    };

    const deleteReview = async (reviewToDelete: Review) => {
        if (!user || !firestore) return;
        
        const reviewRef = doc(firestore, 'reviews', reviewToDelete.id);

        try {
            await deleteDoc(reviewRef);
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
        addReview,
        addMarkerWithReview,
        updateReview,
        deleteReview,
        deleteMarker,
    };
}
