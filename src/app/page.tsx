
'use client';

import { useState, useMemo, useCallback } from 'react';
import MapView from '@/components/map-view';
import MarkerDetails from '@/components/marker-details';
import MarkerForm from '@/components/marker-form';
import { useMarkers } from '@/hooks/use-markers';
import { useAuth } from '@/contexts/auth-context';
import type { Review, ReviewMedia } from '@/lib/types';
import ReviewsSidebar from '@/components/reviews-sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


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
  
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [isMarkerDetailsOpen, setIsMarkerDetailsOpen] = useState(false);


  const selectedMarker = useMemo(() => 
    selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null,
  [markers, selectedMarkerId]);

  const reviewsForSelectedMarker = useMemo(() => 
    selectedMarkerId ? reviews.filter(r => r.markerId === selectedMarkerId) : [],
  [reviews, selectedMarkerId]);

  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    if (user) {
        setSelectedMarkerId(null);
        setIsMarkerDetailsOpen(false);
        setNewMarkerCoords(coords);
    } else {
        console.log("User must be logged in to create a marker");
    }
  }, [user]);

  const handleCreateMarkerWithReview = async (data: Omit<Review, 'id'|'createdAt'|'authorId'|'markerId' | 'authorName' | 'authorAvatarUrl'> & {name?:string; media?: File[]}) => {
    if (newMarkerCoords) {
      const newMarkerId = await addMarkerWithReview(newMarkerCoords, data);
      if (newMarkerId) {
        setSelectedMarkerId(newMarkerId);
        setIsMarkerDetailsOpen(true);
      }
      setNewMarkerCoords(null); 
    }
  };

  const handleAddReview = async (markerId: string, reviewData: Omit<Review, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'> & { media?: File[] }) => {
      await addReview(markerId, reviewData);
  }

  const handleUpdateReview = async (review: Review, updatedData: { text: string; rating: number; media?: File[] }) => {
    await updateReview(review, updatedData);
    setEditingReview(null);
  }

  const handleDeleteReview = async () => {
      if (deletingReview) {
        await deleteReview(deletingReview);
        setDeletingReview(null);
      }
  }


  const handleMarkerClick = (markerId: string) => {
    setNewMarkerCoords(null);
    setSelectedMarkerId(markerId);
    setIsMarkerDetailsOpen(true);
    const marker = markers.find(m => m.id === markerId);
    if(marker) {
      setMapState(prev => ({...prev, center: [marker.lat, marker.lng]}))
    }
  };
  
  const handleCloseDetails = () => {
    setSelectedMarkerId(null);
    setIsMarkerDetailsOpen(false);
    setEditingReview(null);
  };
  
  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    if (review.markerId !== selectedMarkerId) {
        setSelectedMarkerId(review.markerId);
    }
    setIsMarkerDetailsOpen(true);
  };


  return (
      <div className="grid grid-cols-1 md:grid-cols-[384px_1fr] h-[calc(100vh-4rem)]">
        <div className="hidden md:flex md:flex-col">
           <ReviewsSidebar 
              reviews={reviews} 
              markers={markers} 
              onReviewSelect={handleMarkerClick} 
              onEditReview={handleEditReview}
              onDeleteReview={setDeletingReview}
            />
        </div>
        <div className="relative">
            <MapView
              mapState={mapState}
              markers={markers}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              selectedMarkerId={selectedMarkerId}
            />
        </div>
        
        {(selectedMarker || editingReview) && (
          <MarkerDetails
            marker={selectedMarker}
            reviews={reviewsForSelectedMarker}
            isOpen={isMarkerDetailsOpen}
            onOpenChange={(open) => !open && handleCloseDetails()}
            onAddReview={handleAddReview}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={setDeletingReview}
            onDeleteMarker={deleteMarker}
            editingReview={editingReview}
            onCancelEdit={() => setEditingReview(null)}
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
        
        <AlertDialog open={!!deletingReview} onOpenChange={(open) => !open && setDeletingReview(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                    Это действие необратимо. Ваш отзыв будет удален навсегда.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteReview} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
