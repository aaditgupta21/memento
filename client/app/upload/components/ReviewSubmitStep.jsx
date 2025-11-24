"use client";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import styles from "../Upload.module.css";

export default function ReviewSubmitStep({
  uploadedFiles,
  caption,
  location,
  categories,
  onBack,
  onSubmit,
  isSubmitting,
}) {
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

  useEffect(() => {
    if (emblaApi && uploadedFiles.length > 0) emblaApi.reInit();
  }, [emblaApi, uploadedFiles]);

  return (
    <>
      <h2>Step 4: Review Your Memory</h2>
      <div className={styles.reviewContainer}>
        <div className={styles.reviewSection}>
          <h3>Photos ({uploadedFiles.length})</h3>
          <div className={styles.embla} ref={emblaRef}>
            <div className={styles.emblaContainer}>
              {uploadedFiles.map((url, idx) => (
                <div key={idx} className={styles.emblaSlide}>
                  <img src={url} alt={`preview ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
          {uploadedFiles.length > 1 && (
            <div className={styles.carouselControls}>
              <button
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canScrollPrev}
                className={styles.carouselBtn}
              >
                ←
              </button>
              <span className={styles.slideCounter}>
                {uploadedFiles.length} images
              </span>
              <button
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canScrollNext}
                className={styles.carouselBtn}
              >
                →
              </button>
            </div>
          )}
        </div>
        <div className={styles.reviewSection}>
          <h3>Caption</h3>
          <p>{caption}</p>
        </div>
        <div className={styles.reviewSection}>
          <h3>Location</h3>
          <p>{location}</p>
        </div>
        <div className={styles.reviewSection}>
          <h3>Categories</h3>
          <p>
            {categories.length > 0 ? categories.join(", ") : "None selected"}
          </p>
        </div>
      </div>
      <div className={styles.stepButtons}>
        <button onClick={onBack} className={styles.backBtn}>
          Back
        </button>
        <button
          onClick={onSubmit}
          className={styles.saveBtn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Post..." : "Create Post"}
        </button>
      </div>
    </>
  );
}
