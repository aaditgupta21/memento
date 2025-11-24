"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import styles from "./Upload.module.css";
import StepIndicator from "./components/StepIndicator";
import UploadImagesStep from "./components/UploadImagesStep";
import CaptionLocationStep from "./components/CaptionLocationStep";
import CategoriesStep from "./components/CategoriesStep";
import ReviewSubmitStep from "./components/ReviewSubmitStep";

export default function Upload() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState(1);
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

  if (loading || !user) return null;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: uploadedFiles.map((url, idx) => ({ url, order: idx })),
          caption: caption.trim(),
          location: location.trim(),
          categories,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }
      await response.json();
      alert("Post created successfully!");
      setUploadedFiles([]);
      setCaption("");
      setLocation("");
      setCategories([]);
      router.push("/feed");
    } catch (err) {
      console.error("Error creating post:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => setStage((s) => Math.max(1, s - 1));

  return (
    <main className={styles.page}>
      <h1>Upload a Memory</h1>
      <div className={styles.uploadForm}>
        <StepIndicator stage={stage} />
        {stage === 1 && (
          <UploadImagesStep
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onNext={handleFirstSubmit}
          />
        )}
        {stage === 2 && (
          <CaptionLocationStep
            caption={caption}
            setCaption={setCaption}
            location={location}
            setLocation={setLocation}
            onBack={handleBack}
            onNext={handleSecondSubmit}
          />
        )}
        {stage === 3 && (
          <CategoriesStep
            categories={categories}
            setCategories={setCategories}
            availableCategories={availableCategories}
            onBack={handleBack}
            onNext={handleThirdSubmit}
          />
        )}
        {stage === 4 && (
          <ReviewSubmitStep
            uploadedFiles={uploadedFiles}
            caption={caption}
            location={location}
            categories={categories}
            onBack={handleBack}
            onSubmit={handleFourthSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </main>
  );
}
