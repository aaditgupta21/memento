"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./likesDialog.module.css";
import { useRouter } from "next/navigation";
export default function LikesDialog({ isOpen, onClose, likes, postId }) {
  const router = useRouter();
  // Disable body scroll when modal is open to prevent background scrolling
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
                // Likes can be stored as either user objects or just IDs; handle both cases
                const user = typeof like === "object" ? like : null;
                const userId = user?._id || like;
                const displayName = user?.displayName || "Unknown User";
                const profilePicture =
                  user?.profilePicture || user?.avatar || "/default.jpeg";

                return (
                  <li key={userId} className={styles.likeItem}>
                    <Link href={`/${displayName}`}>
                      <Image
                        src={profilePicture}
                        alt={displayName}
                        width={40}
                        height={40}
                        className={styles.avatar}
                      />
                    </Link>
                    <button
                      className={styles.username}
                      onClick={() => router.push(`/${displayName}`)}
                    >
                      {displayName}
                    </button>
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
