import { useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useEffect, useRef, useCallback } from 'react';
import { BubblePin } from './BubblePin';

/**
 * Manages marker clustering for photos and posts
 * Uses refs to register markers with MarkerClusterer
 */
export function ClusteredMarkers({ points, onPointClick, zoom }) {
  const map = useMap();
  const clustererRef = useRef(null);
  const markersRef = useRef(new Map());

  // Initialize MarkerClusterer
  useEffect(() => {
    if (!map) return;

    clustererRef.current = new MarkerClusterer({
      map,
      algorithmOptions: {
        radius: 80,
        maxZoom: 16,
      },
      onClusterClick: (event, cluster, map) => {
        map.fitBounds(cluster.bounds, { padding: 100 });
      },
    });

    return () => {
      clustererRef.current?.clearMarkers();
      clustererRef.current?.setMap(null);
    };
  }, [map]);

  // Handle marker load callback
  const handleMarkerLoad = useCallback((marker, pointId) => {
    markersRef.current.set(pointId, marker);

    if (clustererRef.current) {
      clustererRef.current.addMarker(marker);
    }
  }, []);

  // Clean up markers when points change
  useEffect(() => {
    if (!clustererRef.current) return;

    // Clear all markers from clusterer
    clustererRef.current.clearMarkers();

    // Re-add all current markers
    const markerArray = Array.from(markersRef.current.values()).filter(Boolean);
    if (markerArray.length > 0) {
      clustererRef.current.addMarkers(markerArray);
    }
  }, [points]);

  return (
    <>
      {points.map((point) => {
        const isPost = point.type === 'post';
        const key = point.id;

        return (
          <BubblePin
            key={key}
            position={{ lat: point.lat, lng: point.lng }}
            imageUrl={point.imageUrl}
            isPost={isPost}
            onClick={() => onPointClick(point)}
            onMarkerLoad={(marker) => handleMarkerLoad(marker, key)}
          />
        );
      })}
    </>
  );
}
