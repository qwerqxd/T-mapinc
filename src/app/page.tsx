
'use client';

import { useState, useEffect, useCallback } from 'react';
import MapView from '@/components/map-view';
import { MarkerDetails } from '@/components/marker-details';
import { MarkerForm } from '@/components/marker-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarkers } from '@/hooks/use-markers';
import { MarkerData } from '@/lib/types';
import { Search, Plus, Filter } from 'lucide-react';
import { YMaps } from '@pbe/react-yandex-maps';

export default function Home() {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isCreatingMarker, setIsCreatingMarker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: [55.75, 37.57], // Москва по умолчанию
    zoom: 10
  });

  const { markers, loading, error, addMarkerWithReview, updateReview, deleteReview, reviews } = useMarkers();

  const filteredMarkers = markers.filter(marker => {
    const markerName = marker.name || '';
    const matchesSearch = markerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const selectedMarker = selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null;
  const selectedMarkerReviews = selectedMarkerId ? reviews.filter(r => r.markerId === selectedMarkerId) : [];
  
  const [newMarkerCoords, setNewMarkerCoords] = useState<{lat: number, lng: number} | null>(null);


  const handleMapClick = useCallback((coords: {lat: number, lng: number}) => {
      setNewMarkerCoords(coords);
  }, []);

  const handleCreateMarker = async (reviewData: Omit<any, 'id' | 'createdAt' | 'updatedAt'| 'authorId' | 'markerId'>) => {
    if (newMarkerCoords) {
      await addMarkerWithReview(newMarkerCoords, reviewData);
      setNewMarkerCoords(null);
    }
  };

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
    <div className="flex h-screen bg-background">
      <div className="w-96 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Карта отзывов</h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold">Метки ({filteredMarkers.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMarkers.map(marker => (
                <div
                  key={marker.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMarkerId === marker.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMarkerId(marker.id)}
                >
                  <div className="font-medium">{marker.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Нажмите, чтобы увидеть отзывы
                  </div>
                </div>
              ))}
              {filteredMarkers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  {markers.length === 0 ? 'Меток пока нет' : 'Ничего не найдено'}
                </div>
              )}
            </div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Нажмите на карту, чтобы выбрать место для нового отзыва.
              </p>
            </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-muted/30">
            <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY, lang: 'ru_RU' }}>
              <MapView
                mapState={mapState}
                markers={filteredMarkers}
                onMarkerClick={(markerId) => setSelectedMarkerId(markerId)}
                onMapClick={handleMapClick}
              />
            </YMaps>
          </div>
        </div>
      </div>

      {selectedMarker && (
        <MarkerDetails
          marker={selectedMarker}
          reviews={selectedMarkerReviews}
          isOpen={!!selectedMarker}
          onOpenChange={(open) => !open && setSelectedMarkerId(null)}
          onAddReview={addReview}
          onUpdateReview={updateReview}
          onDeleteReview={deleteReview}
          onDeleteMarker={() => {}} // This should be handled inside useMarkers now
        />
      )}

      {newMarkerCoords && (
        <MarkerForm
          coords={newMarkerCoords}
          isOpen={!!newMarkerCoords}
          onOpenChange={(open) => !open && setNewMarkerCoords(null)}
          onMarkerCreate={handleCreateMarker}
        />
      )}
    </div>
  );
}
