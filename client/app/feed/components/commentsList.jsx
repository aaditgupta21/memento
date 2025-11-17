"use client";

import styles from "./commentsList.module.css";

export default function CommentsList({ comments }) {
  return (
    <div className={styles.comments}>
      {comments.map((comment) => (
        <div key={comment.id} className={styles.comment}>
          <span className={styles.commentAuthor}>
            {comment.author.username}
          </span>
          : {comment.text}
        </div>
      ))}
    </div>
  );
}
