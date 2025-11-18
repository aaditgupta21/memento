"use client";

import styles from "./postActions.module.css";

export default function PostActions({
  isLiked,
  likeCount,
  onToggleLike,
  onLikeCountClick,
  isLiking = false,
}) {
  return (
    <div className={styles.actions}>
      <button
        onClick={onToggleLike}
        className={styles.likeBtn}
        disabled={isLiking}
      >
        {isLiking ? "..." : isLiked ? "Unlike" : "Like"}
      </button>

      {likeCount > 0 ? (
        <button
          onClick={onLikeCountClick}
          className={styles.likeCount}
          type="button"
        >
          <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
        </button>
      ) : (
        <span className={styles.likeCount}>
          <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
        </span>
      )}
    </div>
  );
}
