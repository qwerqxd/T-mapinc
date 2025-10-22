
'use client';

import { YMaps } from '@pbe/react-yandex-maps';
import { useState } from 'react';
import type { MarkerData, Review } from '@/lib/types';
import AppHeader from '@/components/app-header';
import ReviewsSidebar from '@/components/reviews-sidebar';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import MarkerDetails from '@/components/marker-details';
import MarkerForm from '@/components/marker-form';
import { useMarkers } from '@/hooks/use-markers';


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
  const { 
    markers, 
    reviews, 
    addReview, 
    addMarkerWithReview, 
    updateReview, 
    deleteReview,
    deleteMarker
  } = useMarkers();
  
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

  const selectedMarker = markers?.find((m) => m.id === selectedMarkerId);
  const reviewsForMarker = reviews.filter((r) => r.markerId === selectedMarkerId);

  const closeDialogs = () => {
    setSelectedMarkerId(null);
    setNewMarkerCoords(null);
  };
  
  const handleAddMarker = async (reviewData: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
    if (!newMarkerCoords) return;
    const newMarkerId = await addMarkerWithReview(newMarkerCoords, reviewData);
    if (newMarkerId) {
      setNewMarkerCoords(null);
      setSelectedMarkerId(newMarkerId);
    }
  }

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
        
        <MarkerDetails 
          marker={selectedMarker}
          reviews={reviewsForMarker}
          isOpen={!!selectedMarker && !newMarkerCoords}
          onOpenChange={(open) => !open && closeDialogs()}
          onAddReview={addReview}
          onUpdateReview={updateReview}
          onDeleteReview={deleteReview}
          onDeleteMarker={deleteMarker}
        />
        
        <MarkerForm
          coords={newMarkerCoords}
          isOpen={!!newMarkerCoords && !selectedMarker}
          onOpenChange={(open) => !open && closeDialogs()}
          onMarkerCreate={handleAddMarker}
        />

      </div>
    </YMaps>
  );
}
