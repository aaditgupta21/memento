"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CreateScrapbookModal.module.css";
import { mockPosts } from "@/mock/posts";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// CREATE NEW SCRAPBOOK

export default function CreateScrapbookModal({
  isOpen,
  onClose,
  onCreate,
  posts = mockPosts,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(posts[0]?.image || "");
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setSelectedPosts([]);
      // Set cover image from first post if available
      const firstPostImage = posts[0]?.images?.[0]?.url || posts[0]?.image || "";
      setCoverImage(firstPostImage);
    }
  }, [isOpen, posts]);

  const selectedCount = useMemo(() => selectedPosts.length, [selectedPosts]);

  const togglePost = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!coverImage.trim()) {
      alert("Please provide a cover image");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage.trim(),
        postIds: selectedPosts,
      };

      console.log("Creating scrapbook with payload:", payload);

      const response = await fetch(`${API_BASE}/api/scrapbooks`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create scrapbook");
      }

      const data = await response.json();

      // Call the onCreate callback with the created scrapbook
      if (onCreate) {
        onCreate(data.scrapbook);
      }

      onClose();
    } catch (error) {
      console.error("Error creating scrapbook:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div>
            <p className={styles.label}>Create</p>
            <h3 className={styles.title}>New Scrapbook</h3>
          </div>
          <button className={styles.closeBtn} type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="scrapbook-title">
              Title
            </label>
            <input
              id="scrapbook-title"
              className={styles.input}
              value={title}
              placeholder="Summer postcards"
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="scrapbook-description">
              Description
            </label>
            <textarea
              id="scrapbook-description"
              className={styles.textarea}
              value={description}
              placeholder="Write a few lines about this collection..."
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="cover-image">
              Cover image URL
            </label>
            <input
              id="cover-image"
              className={styles.input}
              value={coverImage}
              placeholder="https://images.unsplash.com/..."
              onChange={(e) => setCoverImage(e.target.value)}
            />
            <p className={styles.hint}>Paste a link or pick a post below.</p>
          </div>

          <div className={styles.pillRow}>
            <span className={styles.pill}>Selected: {selectedCount}</span>
            <span className={styles.pill}>Total posts: {posts.length}</span>
          </div>

          <div className={styles.grid}>
            {posts.map((post) => {
              // Use _id for API posts, fallback to id for mock posts
              const postId = post._id || post.id;
              const postImage = post.images?.[0]?.url || post.image || "";
              const postTitle = post.caption || post.title || "Untitled";
              const postLocation = post.location || "";

              const isSelected = selectedPosts.includes(postId);
              return (
                <button
                  key={postId}
                  type="button"
                  className={`${styles.postTile} ${
                    isSelected ? styles.postTileSelected : ""
                  }`}
                  onClick={() => {
                    togglePost(postId);
                    // Don't automatically override cover image if user has manually entered a URL
                    // Only set it if the current value is empty or matches the default first post image
                    const defaultImage = posts[0]?.images?.[0]?.url || posts[0]?.image || "";
                    if (!coverImage || coverImage === defaultImage) {
                      setCoverImage(postImage);
                    }
                  }}
                >
                  <img
                    src={postImage}
                    alt={postTitle}
                    className={styles.postImage}
                  />
                  <div className={styles.postOverlay}>
                    <span className={styles.postTitle}>{postTitle}</span>
                    <span className={styles.location}>{postLocation}</span>
                  </div>
                  {isSelected && <div className={styles.checkmark}>✓</div>}
                </button>
              );
            })}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Scrapbook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
