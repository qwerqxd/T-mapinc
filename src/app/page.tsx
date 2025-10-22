
'use client';

import { useState, useEffect, useCallback } from 'react';
import MapView from '@/components/map-view';
import { MarkerDetails } from '@/components/marker-details';
import { MarkerForm } from '@/components/marker-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarkers } from '@/hooks/use-markers';
import { type MarkerData as Marker } from '@/lib/types';
import { Search, Plus, Filter } from 'lucide-react';
import AppHeader from '@/components/app-header';

export default function Home() {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isCreatingMarker, setIsCreatingMarker] = useState(false);
  const [newMarkerCoords, setNewMarkerCoords] = useState<[number, number] | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  const { markers, loading, error, addMarkerWithReview, updateReview, deleteReview, reviews } = useMarkers();
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: [55.75, 37.57], // Москва по умолчанию
    zoom: 10
  });

  const [isMarkerDetailsOpen, setIsMarkerDetailsOpen] = useState(false);
  const [isMarkerFormOpen, setIsMarkerFormOpen] = useState(false);

  const filteredMarkers = markers.filter(marker => {
    const markerName = marker.name || '';
    const markerReviews = reviews.filter(r => r.markerId === marker.id);
    const reviewTexts = markerReviews.map(r => r.text).join(' ');

    return markerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           reviewTexts.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedMarker = selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null;
  const selectedMarkerReviews = selectedMarkerId ? reviews.filter(r => r.markerId === selectedMarkerId) : [];


  const handleMapClick = useCallback((coords: [number, number]) => {
    setNewMarkerCoords(coords);
    setIsMarkerFormOpen(true);
  }, []);

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarkerId(markerId);
    setIsMarkerDetailsOpen(true);
  }

  const handleCreateMarker = async (reviewData: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'markerId'>) => {
    if (newMarkerCoords) {
      await addMarkerWithReview({ lat: newMarkerCoords[0], lng: newMarkerCoords[1] }, reviewData);
      setIsMarkerFormOpen(false);
      setNewMarkerCoords(null);
    }
  };

  useEffect(() => {
    if(selectedMarkerId) {
      const marker = markers.find(m => m.id === selectedMarkerId);
      if(marker) {
        setMapState(prevState => ({ ...prevState, center: [marker.lat, marker.lng], zoom: 15 }));
      }
    }
  }, [selectedMarkerId, markers]);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Загрузка карты...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Ошибка: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Карта отзывов</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию или отзыву..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
           <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Нажмите на карту, чтобы оставить отзыв о новом месте.
              </p>
            </div>
          <div className="flex-1 space-y-3 overflow-hidden">
            <h3 className="font-semibold">Недавние отзывы ({reviews.length})</h3>
            <div className="space-y-2 h-full overflow-y-auto">
              {reviews.slice(0, 10).map(review => {
                  const marker = markers.find(m => m.id === review.markerId);
                  return (
                    <div
                      key={review.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMarkerId === review.markerId
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleMarkerClick(review.markerId)}
                    >
                      <div className="font-medium truncate">{marker?.name || "Место без названия"}</div>
                      <p className="text-sm text-muted-foreground truncate">{review.text}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(review.createdAt.toString()).toLocaleDateString('ru-RU')} - {review.authorName}
                      </div>
                    </div>
                  )
              })}
              {reviews.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Отзывов пока нет.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-muted/30">
              <MapView
                mapState={mapState}
                markers={filteredMarkers}
                onMarkerClick={handleMarkerClick}
                onMapClick={handleMapClick}
                onMapStateChange={setMapState}
              />
            </div>
          </div>
        </div>

        {selectedMarker && (
          <MarkerDetails
            marker={selectedMarker}
            reviews={selectedMarkerReviews}
            isOpen={isMarkerDetailsOpen}
            onOpenChange={setIsMarkerDetailsOpen}
            onAddReview={updateReview}
            onUpdateReview={updateReview}
            onDeleteReview={deleteReview}
            onDeleteMarker={() => {}}
          />
        )}
        
        {isMarkerFormOpen && newMarkerCoords && (
           <MarkerForm
             isOpen={isMarkerFormOpen}
             onOpenChange={setIsMarkerFormOpen}
             coords={{ lat: newMarkerCoords[0], lng: newMarkerCoords[1] }}
             onMarkerCreate={handleCreateMarker}
           />
        )}
      </div>
    </div>
  );
}
