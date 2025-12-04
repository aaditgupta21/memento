"use client";
import { UploadDropzone } from "@/utils/uploadthing";
import styles from "./UploadImagesStep.module.css";
import PostImage from "@/app/feed/components/postImage";

export default function UploadImagesStep({
  uploadedFiles,
  setUploadedFiles,
  onNext,
}) {
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
            // Capture both URL and EXIF data from upload response
            const filesWithExif = res.map((f) => ({
              url: f.url || f.ufsUrl, // Fallback to ufsUrl if url doesn't exist
              exif: f.serverData?.exif || null,
            }));
            setUploadedFiles((prev) => [...prev, ...filesWithExif]);
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
        <div className={styles.previewContainer}>
          <PostImage
            key={uploadedFiles.map((f) => f.url || f).join(",")}
            imageUrls={uploadedFiles.map((f) => f.url || f)}
            caption={null}
          />
          <p className={styles.imageCount}>
            {uploadedFiles.length}{" "}
            {uploadedFiles.length === 1 ? "image" : "images"} uploaded
          </p>
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
