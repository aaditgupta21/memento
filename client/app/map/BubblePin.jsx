import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { forwardRef } from 'react';
import styles from './BubblePin.module.css';

/**
 * Custom marker component with circular bubble pin
 * Displays photo thumbnail with optional count badge
 */
export const BubblePin = forwardRef(function BubblePin(
  {
    position,
    imageUrl,
    pointCount,
    isPost = false,
    onClick
  },
  ref
) {
  const size = isPost ? 65 : 50;

  return (
    <AdvancedMarker
      ref={ref}
      position={position}
      onClick={onClick}
    >
      <div
        className={styles.bubblePin}
        style={{ width: size, height: size }}
      >
        {imageUrl ? (
          <div className={styles.photoCircle}>
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
});
