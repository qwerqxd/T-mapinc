
'use client';

import { Map, Placemark, useYMaps } from '@pbe/react-yandex-maps';
import { memo, useEffect, useRef } from 'react';

interface MapViewProps {
  markers: { id: string; lat: number; lng: number }[];
  onMarkerClick: (markerId: string) => void;
  onMapClick: (coords: { lat: number; lng: number }) => void;
  mapState: { center: [number, number], zoom: number };
  selectedMarkerId?: string | null;
}

function MapView({
  markers,
  onMarkerClick,
  onMapClick,
  mapState,
  selectedMarkerId,
}: MapViewProps) {
  const ymaps = useYMaps(['Map']);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (ymaps && mapRef.current) {
        mapRef.current.setCenter(mapState.center, mapState.zoom, {
            checkZoomRange: true,
            duration: 300,
        });
    }
  }, [mapState, ymaps]);


  return (
    <Map
      width="100%"
      height="100%"
      defaultState={mapState}
      instanceRef={mapRef}
      onClick={(e: any) => {
        const coords = e.get('coords');
        if (coords) {
            onMapClick({lat: coords[0], lng: coords[1]});
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
            preset: marker.id === selectedMarkerId ? 'islands#redDotIcon' : 'islands#blueDotIcon',
          }}
        />
      ))}
    </Map>
  );
}

export default memo(MapView);
