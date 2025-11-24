"use client";

import { UploadButton, UploadDropzone } from "@/utils/uploadthing";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import styles from "./Upload.module.css";
import useEmblaCarousel from "embla-carousel-react";

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [stage, setStage] = useState(1); // make upload multi-stage
  const { user, loading } = useUser();
  const router = useRouter();

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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

  // Update carousel buttons on scroll
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

  // Reinitialize carousel when files change
  useEffect(() => {
    if (emblaApi && uploadedFiles.length > 0) {
      emblaApi.reInit();
    }
  }, [emblaApi, uploadedFiles]);

  // Close dropdown on Escape key or outside click
  useEffect(() => {
    if (!isCatOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsCatOpen(false);
      }
    };

    const handleOutsideClick = (e) => {
      const dropdown = document.querySelector(`.${styles.categoriesWrap}`);
      if (dropdown && !dropdown.contains(e.target)) {
        setIsCatOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isCatOpen]);

  if (loading || !user) {
    return null;
  }

  const handleFirstSubmit = () => {
    if (uploadedFiles.length === 0) {
      alert("Please upload at least one image first");
      return;
    }
    setStage(2);
  };

  const handleSecondSubmit = () => {
    if (caption.trim() === "") {
      alert("Please add a caption for your memory");
      return;
    } else if (location.trim() === "") {
      alert("Please add a location for your memory");
      return;
    }
    setStage(3);
  };

  const handleThirdSubmit = () => {
    setStage(4); // optional, so always proceed to final submission
  };

  const handleFourthSubmit = async () => {
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
          location: location.trim(),
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

      // Redirect to feed page
      router.push("/feed");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStage(stage - 1); // wont render it on first stage, so no negative stages
  };

  return (
    <main className={styles.page}>
      <h1>Upload a Memory</h1>

      <div className={styles.uploadForm}>
        {/* Progress indicator */}
        <div className={styles.stepIndicator}>
          {/* conditional classes based on stage */}
          <div className={`${styles.step} ${stage >= 1 ? styles.active : ""}`}>
            1
          </div>
          <div
            className={`${styles.stepLine} ${stage >= 2 ? styles.active : ""}`}
          ></div>
          <div className={`${styles.step} ${stage >= 2 ? styles.active : ""}`}>
            2
          </div>
          <div
            className={`${styles.stepLine} ${stage >= 3 ? styles.active : ""}`}
          ></div>
          <div className={`${styles.step} ${stage >= 3 ? styles.active : ""}`}>
            3
          </div>
          <div
            className={`${styles.stepLine} ${stage >= 4 ? styles.active : ""}`}
          ></div>
          <div className={`${styles.step} ${stage >= 4 ? styles.active : ""}`}>
            4
          </div>
        </div>
        {/* step 1 upload */}
        {stage === 1 && (
          <>
            <h2>Upload Images</h2>
            <UploadDropzone
              endpoint="imageUploader"
              className={styles.dropzone}
              config={{
                mode: "auto",
              }}
              onClientUploadComplete={(res) => {
                console.log("Upload complete! Files:", res);
                if (res && res.length > 0) {
                  const urls = res.map((file) => file.url);
                  console.log("Uploaded image URLs:", urls);
                  setUploadedFiles((prev) => [...prev, ...urls]);
                }
              }}
              onUploadError={(error) => {
                console.error("Upload error:", error);
                alert(`ERROR! ${error.message}`);
              }}
              content={{
                uploadIcon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    style={{
                      width: "64px",
                      height: "64px",
                      marginBottom: "2rem",
                    }}
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
                        <p className={styles.lightText}>
                          or click to select a photo
                        </p>
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

                {/* Carousel Controls */}
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
                onClick={handleFirstSubmit}
                className={styles.saveBtn}
                disabled={uploadedFiles.length === 0}
              >
                Next: Caption & Location
              </button>
            </div>
          </>
        )}

        {/* Step 2: Caption and Location */}
        {stage === 2 && (
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
              <button onClick={handleBack} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={handleSecondSubmit}
                className={styles.saveBtn}
                disabled={caption.trim() === "" || location.trim() === ""}
              >
                Next: Categories
              </button>
            </div>
          </>
        )}

        {/* Step 3: Categories */}
        {stage === 3 && (
          <>
            <h2>Step 3: Categories</h2>
            <div className={styles.categoriesWrap}>
              <label className={styles.catLabel}>Categories (optional)</label>
              <button
                type="button"
                className={styles.catDropdownBtn}
                onClick={() => setIsCatOpen(!isCatOpen)}
                aria-expanded={isCatOpen}
              >
                {categories.length === 0 ? (
                  <span className={styles.catPlaceholder}>
                    Select categories...
                  </span>
                ) : (
                  <div className={styles.catBadges}>
                    {categories.map((cat) => (
                      <span key={cat} className={styles.catBadge}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                <span className={styles.catCaret}>▾</span>
              </button>

              {isCatOpen && (
                <div className={styles.catDropdownPanel}>
                  {availableCategories.map((cat) => {
                    const checked = categories.includes(cat);
                    return (
                      <label key={cat} className={styles.catOption}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategories((prev) => [...prev, cat]);
                            } else {
                              setCategories((prev) =>
                                prev.filter((c) => c !== cat)
                              );
                            }
                          }}
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={styles.stepButtons}>
              <button onClick={handleBack} className={styles.backBtn}>
                Back
              </button>
              <button onClick={handleThirdSubmit} className={styles.saveBtn}>
                Review & Submit
              </button>
            </div>
          </>
        )}

        {/* step 4: Review & Submit */}
        {stage === 4 && (
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
                  {categories.length > 0
                    ? categories.join(", ")
                    : "None selected"}
                </p>
              </div>
            </div>

            <div className={styles.stepButtons}>
              <button onClick={handleBack} className={styles.backBtn}>
                Back
              </button>
              <button
                onClick={handleFourthSubmit}
                className={styles.saveBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Post..." : "Create Post"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
