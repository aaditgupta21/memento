"use client";

import { useEffect } from "react";
import styles from "./PostDetailModal.module.css";
import PostImage from "../../feed/components/postImage";
import { useUser } from "@/context/UserContext";

// Lightweight modal to show a single post's details
export default function PostDetailModal({ post, onClose }) {
  // check if this is own post
  const { user } = useUser();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!post) return null;

  const isOwnPost = post.author?._id === user?.id;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  // Handle both API format and transformed format for backward compatibility
  const imageUrls = post.images?.map((img) => img.url) || [post.image] || [];
  const title = post.caption || post.title || "Untitled";
  const description = post.caption || post.description || "";
  const location = post.location || "";
  const date = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : post.date || "";
  const likesCount = Array.isArray(post.likes)
    ? post.likes.length
    : post.likes || 0;
  const commentsCount = post.comments?.length || 0;

  // function to handleDelete
  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/posts/${post._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete post");
      }

      onClose(); // Close the modal
      window.location.reload(); // Refresh to update gallery
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(`Failed to delete post: ${error.message}`);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} type="button" onClick={onClose}>
          ×
        </button>
        <div className={styles.content}>
          <div className={styles.media}>
            {/* caption null because shown in detail section */}
            <PostImage imageUrls={imageUrls} caption={null} />
          </div>
          <div className={styles.detail}>
            <p className={styles.eyebrow}>{location || "No location"}</p>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.meta}>{date}</p>
            <p className={styles.description}>{description}</p>
            <div className={styles.stats}>
              <span className={styles.pill}>
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </span>
              <span className={styles.pill}>{commentsCount} comments</span>
            </div>
            <div className={styles.comments}>
              {(post.comments || []).map((comment, idx) => {
                // Handle both API format (author object) and transformed format (user string)
                const authorName =
                  comment.author?.displayName ||
                  comment.author?.username ||
                  comment.user ||
                  "Unknown";
                return (
                  <div key={comment._id || idx} className={styles.comment}>
                    <span className={styles.commentUser}>{authorName}</span>
                    <span className={styles.commentText}>{comment.text}</span>
                  </div>
                );
              })}
              {isOwnPost && (
                <button
                  className={styles.deleteBtn}
                  type="button"
                  onClick={handleDelete}
                >
                  Delete Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
