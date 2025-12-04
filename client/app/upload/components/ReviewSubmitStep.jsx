"use client";
import styles from "./ReviewSubmitStep.module.css";
import PostImage from "@/app/feed/components/postImage";

export default function ReviewSubmitStep({
  uploadedFiles,
  caption,
  location,
  categories,
  onBack,
  onSubmit,
  isSubmitting,
}) {
  // Convert uploadedFiles to image URLs for PostImage component
  const imageUrls = uploadedFiles.map((file) => {
    if (typeof file === "string") return file;
    return file.url;
  });

  return (
    <>
      <h2>Step 4: Review Your Memory</h2>
      <div className={styles.reviewContainer}>
        <div className={styles.reviewSection}>
          <h3>Photos ({uploadedFiles.length})</h3>
          {/* use postImage instead of reimplementing image display */}
          <PostImage imageUrls={imageUrls} caption={null} />
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
