'use client';

import { Map, Placemark } from '@pbe/react-yandex-maps';
import { memo } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Globe, Map as MapIcon, Satellite } from 'lucide-react';


interface MapViewProps {
  markers: { id: string; lat: number; lng: number }[];
  onMarkerClick: (markerId: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  mapState: { center: [number, number], zoom: number };
  mapType: 'yandex#map' | 'yandex#satellite' | 'yandex#hybrid';
  onMapTypeChange: (type: 'yandex#map' | 'yandex#satellite' | 'yandex#hybrid') => void;
}

function MapView({
  markers,
  onMarkerClick,
  onMapClick,
  mapState,
  mapType,
  onMapTypeChange
}: MapViewProps) {
  return (
    <>
      <Map
        width="100%"
        height="100%"
        state={mapState}
        type={mapType}
        onClick={(e: any) => {
          const coords = e.get('coords');
          if (coords) {
              onMapClick(coords[0], coords[1]);
          }
        }}
      >
        {markers.map((marker) => (
          <Placemark
            key={marker.id}
            geometry={[marker.lat, marker.lng]}
            onClick={(e: any) => {
              e.stopPropagation();
              onMarkerClick(marker.id);
            }}
            options={{
              preset: 'islands#blueDotIcon',
            }}
          />
        ))}
      </Map>
       <div className="absolute top-3 right-3 z-10">
        <ToggleGroup
          type="single"
          value={mapType}
          onValueChange={(value: 'yandex#map' | 'yandex#satellite' | 'yandex#hybrid') => {
            if (value) onMapTypeChange(value);
          }}
          className="bg-card rounded-md shadow-md p-1"
        >
          <ToggleGroupItem value="yandex#map" aria-label="Карта">
            <MapIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="yandex#satellite" aria-label="Спутник">
            <Satellite className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="yandex#hybrid" aria-label="Гибрид">
            <Globe className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </>
  );
}

export default memo(MapView);
