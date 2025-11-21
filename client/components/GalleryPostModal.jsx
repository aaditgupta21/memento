"use client";

import { useMemo } from "react";
import { useUser } from "@/context/UserContext";
import ProfileHeader from "@/app/[username]/components/ProfileHeader";
import modalStyles from "@/app/[username]/components/PostModal.module.css";
import styles from "./GalleryPostModal.module.css";

export default function GalleryPostModal({ post, onClose }) {
  const { user } = useUser();

  const profileUser = useMemo(
    () => ({
      displayName: user?.displayName || "You",
      profilePicture: user?.profilePicture || "/default.jpeg",
    }),
    [user]
  );

  if (!post) return null;

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div
        className={modalStyles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={modalStyles.modalClose}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className={styles.headerWrap}>
          <ProfileHeader
            profileUser={profileUser}
            postsCount={post.likes || 1}
            variant="modal"
          />
        </div>

        <div className={styles.body}>
          <div className={styles.media}>
            <img src={post.image} alt={post.title} />
          </div>
          <div className={styles.meta}>
            <p className={styles.location}>{post.location}</p>
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.date}>{post.date}</p>
            <p className={styles.description}>{post.description}</p>
            <div className={styles.stats}>
              <span className={styles.pill}>{post.likes ?? 0} likes</span>
              <span className={styles.pill}>
                {(post.comments || []).length} comments
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
