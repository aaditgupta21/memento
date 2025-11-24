"use client";
import styles from "../Upload.module.css";

export default function CaptionLocationStep({
  caption,
  setCaption,
  location,
  setLocation,
  onBack,
  onNext,
}) {
  return (
    <>
      <h2>Step 2: Caption & Location</h2>
      <input
        type="text"
        placeholder="Caption (required)"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className={styles.input}
      />
      <input
        type="text"
        placeholder="Location (required)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={styles.input}
      />
      <div className={styles.stepButtons}>
        <button onClick={onBack} className={styles.backBtn}>
          Back
        </button>
        <button
          onClick={onNext}
          className={styles.saveBtn}
          disabled={caption.trim() === "" || location.trim() === ""}
        >
          Next: Categories
        </button>
      </div>
    </>
  );
}
