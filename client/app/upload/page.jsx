"use client";

import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import styles from "./Upload.module.css";
import { UseEmblaCarouselType } from "embla-carousel-react";

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  const availableCategories = [
    "Travel",
    "Sports",
    "Gaming",
    "Lifestyle",
    "Food",
    "Fitness",
    "Fashion",
    "Beauty",
    "Wellness",
    "Home",
    "Family",
    "Art",
    "Music",
    "Photography",
    "Nature",
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one image first");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:4000/api/posts", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          images: uploadedFiles.map((url, idx) => ({
            url,
            order: idx,
          })),
          caption: caption.trim(),
          location: location.trim() || undefined,
          categories,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }

      const data = await response.json();
      alert("Post created successfully!");

      // Reset form
      setUploadedFiles([]);
      setCaption("");
      setLocation("");
      setCategories([]);
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1>Upload a Photo</h1>

      <div className={styles.uploadForm}>
        <UploadDropzone
          endpoint="imageUploader"
          className={styles.dropzone}
          onClientUploadComplete={(res) => {
            console.log("Upload complete! Files:", res);
            if (res && res.length > 0) {
              const urls = res.map((file) => file.url);
              console.log("Uploaded image URLs:", urls);
              setUploadedFiles(urls);
            }
          }}
          onUploadError={(error) => {
            console.error("Upload error:", error);
            alert(`ERROR! ${error.message}`);
          }}
          render={({ isDragActive }) => (
            <div
              className={`${styles.dropzone} ${
                isDragActive ? styles.active : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8M8 16l4-4 4 4" />
              </svg>
              <p>
                {isDragActive
                  ? "Release to upload your images"
                  : "Drag and drop up to 10 images here, or click to select files."}
              </p>
            </div>
          )}
        />

        {uploadedFiles.length > 0 && (
          <div className={styles.previewWrap}>
            {uploadedFiles.map((url, idx) => (
              <div key={idx}>
                <img src={url} alt={`preview ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}

        <div className={styles.categoriesWrap}>
          <p>Select categories (optional):</p>
          <div className={styles.categoriesGrid}>
            {availableCategories.map((cat) => {
              const checked = categories.includes(cat);
              return (
                <label key={cat} className={styles.categoryItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCategories((prev) => [...prev, cat]);
                      } else {
                        setCategories((prev) => prev.filter((c) => c !== cat));
                      }
                    }}
                  />
                  <span>{cat}</span>
                </label>
              );
            })}
          </div>
        </div>

        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className={styles.input}
        />

        <input
          type="text"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={styles.input}
        />

        <button
          onClick={handleSubmit}
          className={styles.saveBtn}
          disabled={uploadedFiles.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Creating Post..." : "Create Post"}
        </button>
      </div>
    </main>
  );
}
