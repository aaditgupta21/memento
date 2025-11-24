"use client";

import styles from "./PostDetailModal.module.css";

// NEW EXPANDED POST MODAL (CAN CHANGE LATER)


// Lightweight modal to show a single post's details
export default function PostDetailModal({ post, onClose }) {
  if (!post) return null;

  // Handle both API format and transformed format for backward compatibility
  const imageUrl = post.images?.[0]?.url || post.image || "";
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

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} type="button" onClick={onClose}>
          ×
        </button>
        <div className={styles.content}>
          <div className={styles.media}>
            <img src={imageUrl} alt={title} />
          </div>
          <div className={styles.detail}>
            <p className={styles.eyebrow}>{location || "No location"}</p>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.meta}>{date}</p>
            <p className={styles.description}>{description}</p>
            <div className={styles.stats}>
              <span className={styles.pill}>{likesCount} likes</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
