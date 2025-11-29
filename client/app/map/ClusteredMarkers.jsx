import { useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useEffect, useRef } from 'react';
import { BubblePin } from './BubblePin';

/**
 * Manages marker clustering for photos and posts
 * Simplified version without ref tracking to avoid infinite loops
 */
export function ClusteredMarkers({ points, onPointClick, zoom }) {
  const map = useMap();
  const clustererRef = useRef(null);
  const markersRef = useRef({});

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

  // Determine if point should show as post (larger) at high zoom
  const isHighZoom = zoom >= 14;

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
            isPost={isPost && isHighZoom}
            onClick={() => onPointClick(point)}
          />
        );
      })}
    </>
  );
}
