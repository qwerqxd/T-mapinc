
'use client';

import { useState, useMemo, useCallback } from 'react';
import MapView from '@/components/map-view';
import MarkerDetails from '@/components/marker-details';
import MarkerForm from '@/components/marker-form';
import { useMarkers } from '@/hooks/use-markers';
import { useAuth } from '@/contexts/auth-context';
import type { Review, MarkerData } from '@/lib/types';
import ReviewsSidebar from '@/components/reviews-sidebar';


export default function Home() {
  const { user } = useAuth();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: [55.75, 37.57],
    zoom: 10
  });

  const { markers, reviews, loading, error, addMarkerWithReview, addReview, updateReview, deleteReview, deleteMarker } = useMarkers();


  const selectedMarker = useMemo(() => 
    selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null,
  [markers, selectedMarkerId]);

  const reviewsForSelectedMarker = useMemo(() => 
    selectedMarkerId ? reviews.filter(r => r.markerId === selectedMarkerId) : [],
  [reviews, selectedMarkerId]);

  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    if (user) {
        setSelectedMarkerId(null);
        setNewMarkerCoords(coords);
    } else {
        // Optionally, show a toast message to the user
    }
  }, [user]);

  const handleCreateMarkerWithReview = async (data: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'> & {name?:string}) => {
    if (newMarkerCoords) {
      const newMarkerId = await addMarkerWithReview(newMarkerCoords, data);
      if (newMarkerId) {
        setSelectedMarkerId(newMarkerId);
      }
      setNewMarkerCoords(null); 
    }
  };

  const handleAddReview = async (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
      await addReview(markerId, reviewData);
  }

  const handleUpdateReview = async (review: Review, updatedData: { text: string; rating: number; }) => {
    await updateReview(review, updatedData);
  }

  const handleDeleteReview = async (review: Review) => {
      await deleteReview(review);
  }


  const handleMarkerClick = (markerId: string) => {
    setNewMarkerCoords(null);
    setSelectedMarkerId(markerId);
    const marker = markers.find(m => m.id === markerId);
    if(marker) {
      setMapState(prev => ({...prev, center: [marker.lat, marker.lng]}))
    }
  };

  const handleCloseDetails = () => {
    setSelectedMarkerId(null);
  };


  return (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_384px] h-[calc(100vh-4rem)]">
        <div className="relative">
            <MapView
              mapState={mapState}
              markers={markers}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              selectedMarkerId={selectedMarkerId}
            />
        </div>
        <div className="hidden md:flex md:flex-col">
           <ReviewsSidebar reviews={reviews} markers={markers} onReviewSelect={handleMarkerClick} />
        </div>
        
        {selectedMarker && (
          <MarkerDetails
            marker={selectedMarker}
            reviews={reviewsForSelectedMarker}
            isOpen={!!selectedMarkerId}
            onOpenChange={(open) => !open && handleCloseDetails()}
            onAddReview={handleAddReview}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={handleDeleteReview}
            onDeleteMarker={deleteMarker}
          />
        )}

        {newMarkerCoords && (
          <MarkerForm
            coords={newMarkerCoords}
            isOpen={!!newMarkerCoords}
            onOpenChange={(open) => !open && setNewMarkerCoords(null)}
            onMarkerCreate={handleCreateMarkerWithReview}
          />
        )}
      </div>
  );
}
