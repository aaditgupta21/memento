"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CreateScrapbookModal.module.css";
import { mockPosts } from "@/mock/posts";

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

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setSelectedPosts([]);
      setCoverImage(posts[0]?.image || "");
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = { title, description, coverImage, postIds: selectedPosts };
    console.log("Scrapbook created:", payload);
    if (onCreate) {
      onCreate(payload);
    }
    onClose();
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
              const isSelected = selectedPosts.includes(post.id);
              return (
                <button
                  key={post.id}
                  type="button"
                  className={`${styles.postTile} ${
                    isSelected ? styles.postTileSelected : ""
                  }`}
                  onClick={() => {
                    togglePost(post.id);
                    setCoverImage(post.image);
                  }}
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className={styles.postImage}
                  />
                  <div className={styles.postOverlay}>
                    <span className={styles.postTitle}>{post.title}</span>
                    <span className={styles.location}>{post.location}</span>
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
            <button type="submit" className={styles.primaryButton}>
              Create Scrapbook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
