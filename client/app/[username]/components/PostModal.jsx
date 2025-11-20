"use client";
import styles from "./PostModal.module.css";
import Post from "@/app/feed/components/post";

export default function PostModal({ selectedPost, user, onClose }) {
  if (!selectedPost) return null;

  return (
    // close post if user clicks outside the box
    <div className={styles.modalOverlay} onClick={onClose}>
      {/* stopPropagation allows user to click inside post without it closing */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <Post post={selectedPost} user={user} />
      </div>
    </div>
  );
}
