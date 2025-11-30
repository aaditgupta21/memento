import { AdvancedMarker, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useEffect } from 'react';
import styles from './BubblePin.module.css';

/**
 * Custom marker component with circular bubble pin
 * Displays photo thumbnail with optional count badge
 */
export function BubblePin({
  position,
  imageUrl,
  pointCount,
  isPost = false,
  onClick,
  onMarkerLoad
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const size = isPost ? 65 : 50;

  // Notify parent when marker is loaded
  useEffect(() => {
    if (marker && onMarkerLoad) {
      onMarkerLoad(marker);
    }
  }, [marker, onMarkerLoad]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={position}
      onClick={onClick}
    >
      <div
        className={styles.bubblePin}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <div className={isPost ? styles.postSquare : styles.photoCircle}>
            <img
              src={imageUrl}
              alt="Location"
              className={styles.thumbnail}
            />
          </div>
        ) : (
          <div className={styles.placeholder}>
            📍
          </div>
        )}

        {pointCount && pointCount > 1 && (
          <div className={styles.countBadge}>
            {pointCount}
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
}
