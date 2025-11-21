"use client";

import styles from "./PostDetailModal.module.css";

// NEW EXPANDED POST MODAL (CAN CHANGE LATER)


// Lightweight modal to show a single post's details
export default function PostDetailModal({ post, onClose }) {
  if (!post) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} type="button" onClick={onClose}>
          ×
        </button>
        <div className={styles.content}>
          <div className={styles.media}>
            <img src={post.image} alt={post.title} />
          </div>
          <div className={styles.detail}>
            <p className={styles.eyebrow}>{post.location}</p>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.meta}>{post.date}</p>
            <p className={styles.description}>{post.description}</p>
            <div className={styles.stats}>
              <span className={styles.pill}>{post.likes} likes</span>
              <span className={styles.pill}>
                {post.comments?.length ?? 0} comments
              </span>
            </div>
            <div className={styles.comments}>
              {(post.comments || []).map((comment, idx) => (
                <div key={idx} className={styles.comment}>
                  <span className={styles.commentUser}>{comment.user}</span>
                  <span className={styles.commentText}>{comment.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
