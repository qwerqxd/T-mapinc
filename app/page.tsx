
'use client';

import { useState, useMemo, useCallback } from 'react';
import MapView from '@/components/map-view';
import MarkerDetails from '@/components/marker-details';
import MarkerForm from '@/components/marker-form';
import { Input } from '@/components/ui/input';
import { useMarkers } from '@/hooks/use-markers';
import type { MarkerData } from '@/lib/types';
import { Search } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user } = useAuth();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [newMarkerCoords, setNewMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: [55.75, 37.57],
    zoom: 10
  });

  const { markers, reviews, addMarkerWithReview, addReview, updateReview, deleteReview } = useMarkers();

  const filteredMarkers = useMemo(() => {
    if (!markers) return [];
    return markers.filter(marker =>
      marker.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [markers, searchQuery]);

  const selectedMarker = useMemo(() => 
    selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null,
  [markers, selectedMarkerId]);

  const reviewsForSelectedMarker = useMemo(() => 
    selectedMarkerId ? reviews.filter(r => r.markerId === selectedMarkerId) : [],
  [reviews, selectedMarkerId]);

  const handleMapClick = useCallback((coords: { lat: number; lng: number }) => {
    if (user) {
        setNewMarkerCoords(coords);
    } else {
        console.log("User must be logged in to create a marker");
        // Optionally, show a toast message to the user
    }
  }, [user]);

  const handleCreateMarkerWithReview = async (reviewData: Omit<any, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
    if (newMarkerCoords) {
      await addMarkerWithReview(newMarkerCoords, reviewData);
      setNewMarkerCoords(null); 
    }
  };

  const handleAddReview = async (markerId: string, reviewData: Omit<any, 'id' | 'createdAt' | 'authorId' | 'markerId' | 'authorName' | 'authorAvatarUrl'>) => {
      await addReview(markerId, reviewData);
  }

  const handleMarkerClick = (markerId: string) => {
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
      <div className="flex h-screen bg-background">
        <div className="w-96 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col">
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Карта маркеров</h1>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto px-6">
            <h3 className="font-semibold">Маркеры ({filteredMarkers.length})</h3>
            <div className="space-y-2">
              {filteredMarkers.map(marker => (
                <div
                  key={marker.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMarkerId === marker.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleMarkerClick(marker.id)}
                >
                  <div className="font-medium">{marker.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {/* Displaying review count could be a future enhancement */}
                  </div>
                </div>
              ))}
              {filteredMarkers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  {markers.length === 0 ? 'Маркеры не найдены' : 'Ничего не найдено'}
                </div>
              )}
            </div>
          </div>

            {user && (
              <div className="p-6 mt-auto">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-500/30">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        Нажмите на карту, чтобы добавить новый отзыв.
                    </p>
                </div>
              </div>
            )}
        </div>

        <div className="flex-1 relative">
            <MapView
              mapState={mapState}
              markers={markers}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              selectedMarkerId={selectedMarkerId}
            />
        </div>

        {selectedMarker && (
          <MarkerDetails
            marker={selectedMarker}
            reviews={reviewsForSelectedMarker}
            isOpen={!!selectedMarkerId}
            onOpenChange={(open) => !open && handleCloseDetails()}
            onAddReview={handleAddReview}
            onUpdateReview={updateReview}
            onDeleteReview={deleteReview}
            onDeleteMarker={() => {}}
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
