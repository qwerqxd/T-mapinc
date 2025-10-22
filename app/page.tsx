'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapView } from '@/components/map-view';
import { MarkerDetails } from '@/components/marker-details';
import { MarkerForm } from '@/components/marker-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarkers } from '@/hooks/use-markers';
import { Marker } from '@/lib/types';
import { Search, Plus, Filter } from 'lucide-react';

export default function Home() {
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isCreatingMarker, setIsCreatingMarker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  
  // ИСПРАВЛЕНИЕ: Явно указать тип для center как [number, number]
  const [mapState, setMapState] = useState<{
    center: [number, number];
    zoom: number;
  }>({
    center: [55.75, 37.57], // Москва по умолчанию
    zoom: 10
  });

  const { markers, loading, error, createMarker, updateMarker, deleteMarker } = useMarkers();

  // Фильтрация маркеров по поисковому запросу и категории
  const filteredMarkers = markers.filter(marker => {
    const matchesSearch = marker.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         marker.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || marker.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Получение уникальных категорий
  useEffect(() => {
    const uniqueCategories = Array.from(new Set(markers.map(marker => marker.category).filter(Boolean)));
    setCategories(uniqueCategories);
  }, [markers]);

  const selectedMarker = selectedMarkerId ? markers.find(m => m.id === selectedMarkerId) : null;

  const handleMapClick = useCallback((coordinates: [number, number]) => {
    if (isCreatingMarker) {
      setIsCreatingMarker(false);
      // Здесь можно открыть форму создания маркера с предзаполненными координатами
      console.log('Создание маркера по координатам:', coordinates);
    }
  }, [isCreatingMarker]);

  const handleCreateMarker = async (markerData: Omit<Marker, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createMarker(markerData);
      setIsCreatingMarker(false);
    } catch (error) {
      console.error('Ошибка при создании маркера:', error);
    }
  };

  const handleUpdateMarker = async (markerId: string, markerData: Partial<Marker>) => {
    try {
      await updateMarker(markerId, markerData);
      setSelectedMarkerId(null);
    } catch (error) {
      console.error('Ошибка при обновлении маркера:', error);
    }
  };

  const handleDeleteMarker = async (markerId: string) => {
    try {
      await deleteMarker(markerId);
      setSelectedMarkerId(null);
    } catch (error) {
      console.error('Ошибка при удалении маркера:', error);
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
        <div className="text-lg text-red-600">Ошибка: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Боковая панель */}
      <div className="w-96 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6 space-y-6">
          {/* Заголовок и кнопка добавления */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Карта маркеров</h1>
            <Button
              onClick={() => setIsCreatingMarker(!isCreatingMarker)}
              variant={isCreatingMarker ? "destructive" : "default"}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingMarker ? 'Отмена' : 'Добавить'}
            </Button>
          </div>

          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск маркеров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Фильтр по категориям */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Категория</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="all">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Список маркеров */}
          <div className="space-y-3">
            <h3 className="font-semibold">Маркеры ({filteredMarkers.length})</h3>
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
                  <div className="font-medium">{marker.title}</div>
                  {marker.category && (
                    <div className="text-sm text-muted-foreground">{marker.category}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(marker.createdAt).toLocaleDateString('ru-RU')}
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

          {/* Подсказка для режима создания */}
          {isCreatingMarker && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Нажмите на карту, чтобы выбрать место для нового маркера
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Основная область с картой */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-muted/30">
            {/* ИСПРАВЛЕНИЕ: mapState теперь имеет правильный тип */}
            <MapView
              mapState={mapState}
              markers={filteredMarkers}
              onMarkerClick={(markerId) => setSelectedMarkerId(markerId)}
              onMapClick={handleMapClick}
              onMapStateChange={setMapState}
            />
          </div>
        </div>
      </div>

      {/* Детали маркера */}
      {selectedMarker && (
        <MarkerDetails
          marker={selectedMarker}
          onClose={() => setSelectedMarkerId(null)}
          onEdit={(markerData) => handleUpdateMarker(selectedMarker.id, markerData)}
          onDelete={() => handleDeleteMarker(selectedMarker.id)}
        />
      )}

      {/* Форма создания маркера */}
      {isCreatingMarker && (
        <MarkerForm
          onSubmit={handleCreateMarker}
          onCancel={() => setIsCreatingMarker(false)}
          initialCoordinates={mapState.center}
        />
      )}
    </div>
  );
}
