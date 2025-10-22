'use client';

import { Map, Placemark } from '@pbe/react-yandex-maps';
import { memo } from 'react';

interface MapViewProps {
  markers: { id: string; lat: number; lng: number }[];
  onMarkerClick: (markerId: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  mapState: { center: [number, number], zoom: number };
}

function MapView({
  markers,
  onMarkerClick,
  onMapClick,
  mapState
}: MapViewProps) {
  return (
    <Map
      width="100%"
      height="100%"
      state={mapState}
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
            // Stop propagation to prevent map click event from firing
            e.stopPropagation();
            onMarkerClick(marker.id);
          }}
          options={{
            preset: 'islands#blueDotIcon',
          }}
        />
      ))}
    </Map>
  );
}

export default memo(MapView);
