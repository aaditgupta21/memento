"use client";
import { UploadDropzone } from "@/utils/uploadthing";
import useEmblaCarousel from "embla-carousel-react";
import { useEffect, useState } from "react";
import styles from "./UploadImagesStep.module.css";

export default function UploadImagesStep({
  uploadedFiles,
  setUploadedFiles,
  onNext,
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
      <h2>Upload Images</h2>
      <UploadDropzone
        endpoint="imageUploader"
        className={styles.dropzone}
        config={{ mode: "auto" }}
        onClientUploadComplete={(res) => {
          if (res && res.length > 0) {
            if (uploadedFiles.length + res.length > 10) {
              alert("You can upload a maximum of 10 photos.");
              return;
            }
            const urls = res.map((f) => f.url);
            setUploadedFiles((prev) => [...prev, ...urls]);
          }
        }}
        onUploadError={(error) => alert(`ERROR! ${error.message}`)}
        content={{
          uploadIcon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              style={{ width: 64, height: 64, marginBottom: "2rem" }}
            >
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8M8 16l4-4 4 4" />
            </svg>
          ),
          label: ({ ready, isUploading }) => (
            <div className={styles.uploadLabel}>
              {isUploading ? (
                <p className={styles.boldText}>Uploading...</p>
              ) : ready ? (
                <>
                  <p className={styles.boldText}>
                    Drag and drop up to 10 photos to upload
                  </p>
                  <p className={styles.lightText}>or click to select a photo</p>
                </>
              ) : (
                <p className={styles.boldText}>Getting ready...</p>
              )}
            </div>
          ),
        }}
      />
      {uploadedFiles.length > 0 && (
        <div className={styles.carouselContainer}>
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
      )}
      <div className={styles.stepButtons}>
        <button
          onClick={onNext}
          className={styles.saveBtn}
          disabled={uploadedFiles.length === 0}
        >
          Next: Caption & Location
        </button>
      </div>
    </>
  );
}
