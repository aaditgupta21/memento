"use client";

import styles from "./postActions.module.css";

export default function PostActions({ isLiked, likeCount, onToggleLike }) {
  return (
    <div className={styles.actions}>
      <button onClick={onToggleLike} className={styles.likeBtn}>
        {isLiked ? "Unlike" : "Like"}
      </button>

      <span className={styles.likeCount}>
        <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
      </span>
    </div>
  );
}
