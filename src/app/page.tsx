
'use client';

import { YMaps } from '@pbe/react-yandex-maps';
import { useState } from 'react';
import type { MarkerData, Review } from '@/lib/types';
import AppHeader from '@/components/app-header';
import ReviewsSidebar from '@/components/reviews-sidebar';
import dynamic from 'next/dynamic';
import MarkerReviewDialog from '@/components/marker-review-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, type CollectionReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocationFromCoords } from '@/ai/flows/get-location-from-coords-flow';

const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});


// Helper function to calculate distance between two coordinates in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export default function Home() {
  const firestore = useFirestore();
  const { data: markers, loading: markersLoading } = useCollection<MarkerData>(firestore ? collection(firestore, 'markers') as CollectionReference<MarkerData> : null);
  const { data: reviews, loading: reviewsLoading } = useCollection<Review>(firestore ? collection(firestore, 'reviews') as CollectionReference<Review> : null);
  
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapState, setMapState] = useState<{ center: [number, number]; zoom: number }>({
    center: [55.751244, 37.618423],
    zoom: 10,
  });


  const { user } = useAuth();
  const { toast } = useToast();

  const handleMapClick = (lat: number, lng: number) => {
    if (!user) {
      toast({
        title: 'Требуется аутентификация',
        description: 'Вам нужно войти в систему, чтобы добавить метку.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!markers) return;

    const nearbyMarker = markers.find(
      (marker) => getDistance(marker.lat, marker.lng, lat, lng) < 500
    );

    if (nearbyMarker) {
      setSelectedMarkerId(nearbyMarker.id);
      toast({
        title: 'Метка уже существует',
        description: 'Рядом уже есть метка. Добавьте свой отзыв к ней.',
      });
    } else {
      setSelectedMarkerId(null);
      setNewMarkerCoords({ lat, lng });
    }
  };
  
  const handleReviewSelect = (markerId: string) => {
    if (!markers) return;
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      setMapState(prevState => ({ ...prevState, center: [marker.lat, marker.lng], zoom: 15 }));
      setSelectedMarkerId(markerId);
    }
  };

  const handleAddReview = (review: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'authorAvatarUrl'>) => {
    if (!user || !selectedMarkerId || !firestore) return;

    const newReview = {
      ...review,
      authorId: user.uid,
      authorName: user.name || 'Анонимный пользователь',
      authorAvatarUrl: user.avatarUrl || null,
      createdAt: serverTimestamp(),
    };
    
    const reviewsCollection = collection(firestore, 'reviews');
    addDoc(reviewsCollection, newReview).then(() => {
        toast({ title: 'Успех', description: 'Ваш отзыв был отправлен.'});
        // We don't close the dialog so user can see their new review.
        setNewReviewText('');
        setNewRating(0);
        setNewMedia([]);
    }).catch(serverError => {
      const permissionError = new FirestorePermissionError({
        path: reviewsCollection.path,
        operation: 'create',
        requestResourceData: newReview,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleUpdateReview = (reviewToUpdate: Review, updatedData: { text: string; rating: number; media?: {type: 'image' | 'video', url: string}[] }) => {
    if (!user || !firestore) return;
    const reviewRef = doc(firestore, 'reviews', reviewToUpdate.id);
    
    const dataToUpdate = {
        ...updatedData,
        updatedAt: serverTimestamp(),
    };

    updateDoc(reviewRef, dataToUpdate).then(() => {
        toast({ title: 'Успех', description: 'Ваш отзыв был обновлен.' });
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: reviewRef.path,
            operation: 'update',
            requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteReview = async (reviewToDelete: Review) => {
    if (!user || !firestore) {
      toast({
        title: 'Ошибка',
        description: 'Вы должны войти в систему, чтобы удалить отзыв.',
        variant: 'destructive'
      });
      return;
    }
    
    const reviewRef = doc(firestore, 'reviews', reviewToDelete.id);

    try {
      await deleteDoc(reviewRef);
      toast({ title: 'Успех', description: 'Ваш отзыв был удален.' });

      // Check if it was the last review for the marker
      const otherReviewsForMarker = reviews?.filter(
        (r) => r.markerId === reviewToDelete.markerId && r.id !== reviewToDelete.id
      );

      if (otherReviewsForMarker && otherReviewsForMarker.length === 0) {
        const markerRef = doc(firestore, 'markers', reviewToDelete.markerId);
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
      closeDialogs();
    } catch (error: any) {
        const permissionError = new FirestorePermissionError({
            path: reviewRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };


  const handleAddMarkerWithReview = async (reviewData: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
    if (!user || !newMarkerCoords || !firestore) return;

    try {
      const location = await getLocationFromCoords({ lat: newMarkerCoords.lat, lng: newMarkerCoords.lng });

      const markersCollection = collection(firestore, 'markers');
      const newMarkerRef = doc(markersCollection);

      const newMarker: Omit<MarkerData, 'id'> = {
        createdBy: user.uid,
        lat: newMarkerCoords.lat,
        lng: newMarkerCoords.lng,
        name: location.name,
      };

      const markerWithId: MarkerData = { ...newMarker, id: newMarkerRef.id };

      await setDoc(newMarkerRef, newMarker);

      const reviewsCollection = collection(firestore, 'reviews');
      const newReview = {
        ...reviewData,
        authorId: user.uid,
        authorName: user.name || 'Анонимный пользователь',
        authorAvatarUrl: user.avatarUrl || null,
        markerId: markerWithId.id,
        createdAt: serverTimestamp(),
      };

      await addDoc(reviewsCollection, newReview);
      
      setNewMarkerCoords(null);
      setSelectedMarkerId(markerWithId.id);
      toast({ title: 'Успех', description: 'Новая метка и ваш отзыв были добавлены.' });

    } catch (error: any) {
      console.error("Error creating marker with review:", error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать метку и отзыв.',
        variant: 'destructive',
      });
      // Basic error handling for demo. In a real app, you might want more specific error handling.
      // e.g. check for Firestore permission errors and emit them.
    }
  };
  
  const selectedMarker = markers?.find((m) => m.id === selectedMarkerId);

  const closeDialogs = () => {
    setSelectedMarkerId(null);
    setNewMarkerCoords(null);
  };
  
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newMedia, setNewMedia] = useState<{type: 'image' | 'video', url: string}[]>([]);

  const allReviewsForMarker = reviews?.filter(r => r.markerId === selectedMarkerId) || [];

  return (
    <YMaps
      query={{
        apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
        lang: 'ru_RU',
      }}
    >
      <div className="flex h-dvh w-full flex-col font-body">
        <AppHeader />
        <main className="grid flex-1 grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr] overflow-hidden">
          <ReviewsSidebar reviews={reviews || []} markers={markers || []} onReviewSelect={handleReviewSelect} />
          <div className="relative h-full bg-muted/30">
            <MapView
              mapState={mapState}
              markers={markers || []}
              onMarkerClick={(markerId) => setSelectedMarkerId(markerId)}
              onMapClick={handleMapClick}
            />
          </div>
        </main>

        <MarkerReviewDialog
          marker={selectedMarker}
          reviews={allReviewsForMarker}
          coords={newMarkerCoords}
          isOpen={!!selectedMarker || !!newMarkerCoords}
          onOpenChange={(open) => !open && closeDialogs()}
          onReviewSubmit={(reviewData) => handleAddReview({...reviewData, markerId: selectedMarkerId || ''})}
          onMarkerCreate={handleAddMarkerWithReview}
          onReviewUpdate={handleUpdateReview}
          onReviewDelete={handleDeleteReview}
          newReviewText={newReviewText}
          setNewReviewText={setNewReviewText}
          newRating={newRating}
          setNewRating={setNewRating}
          newMedia={newMedia}
          setNewMedia={setNewMedia}
        />
      </div>
    </YMaps>
  );
}
