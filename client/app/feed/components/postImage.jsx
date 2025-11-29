"use client";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./postImage.module.css";

export default function PostImage({ imageUrls, caption }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  // Single image, no carousel
  if (imageUrls.length === 1) {
    return (
      <div>
        <div className={styles.imageContainer}>
          <img src={imageUrls[0]} alt="image-0" className={styles.postImage} />
        </div>
        {/* fix issue of padding for single image posts */}
        <div style={{ padding: "0.5rem 0" }}></div>
        {caption && <h2 className={styles.caption}>{caption}</h2>}
      </div>
    );
  }

  // Multiple images, show carousel
  return (
    <div>
      <div className={styles.carouselWrapper}>
        <div className={styles.embla} ref={emblaRef}>
          <div className={styles.emblaContainer}>
            {imageUrls.map((url, index) => (
              <div key={index} className={styles.emblaSlide}>
                <img
                  src={url}
                  alt={`image-${index}`}
                  className={styles.postImage}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay Navigation Buttons */}
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className={`${styles.carouselBtn} ${styles.prevBtn}`}
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className={`${styles.carouselBtn} ${styles.nextBtn}`}
          aria-label="Next image"
        >
          ›
        </button>
      </div>
      {caption && <h2 className={styles.caption}>{caption}</h2>}
    </div>
  );
}
