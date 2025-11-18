"use client";

import { useEffect } from "react";
import Image from "next/image";
import styles from "./likesDialog.module.css";

export default function LikesDialog({ isOpen, onClose, likes, postId }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Likes</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.content}>
          {likes && likes.length > 0 ? (
            <ul className={styles.likesList}>
              {likes.map((like) => {
                const user = typeof like === "object" ? like : null;
                const userId = user?._id || like;
                const displayName = user?.displayName || "Unknown User";
                const profilePicture =
                  user?.profilePicture || user?.avatar || "/default.jpeg";

                return (
                  <li key={userId} className={styles.likeItem}>
                    <Image
                      src={profilePicture}
                      alt={displayName}
                      width={40}
                      height={40}
                      className={styles.avatar}
                    />
                    <span className={styles.username}>{displayName}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.noLikes}>No likes yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

