"use client";

import styles from "./commentsList.module.css";

export default function CommentsList({ comments }) {
  return (
    <div className={styles.comments}>
      {comments.map((comment) => (
        <div key={comment._id || comment.id} className={styles.comment}>
          <span className={styles.commentAuthor}>
            {comment.author?.displayName || comment.author?.username || "Unknown"}
          </span>
          : {comment.text}
        </div>
      ))}
    </div>
  );
}
