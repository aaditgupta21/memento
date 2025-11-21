"use client";

import styles from "./commentForm.module.css";

export default function CommentForm({ onSubmit }) {
  return (
    <form onSubmit={onSubmit} className={styles.addCommentForm}>
      <input
        type="text"
        name="comment"
        placeholder="Add a comment..."
        className={styles.commentInput}
      />
      <button type="submit" className={styles.postBtn}>
        Post
      </button>
    </form>
  );
}
