"use client";

import styles from "./toggleCommentButton.module.css";

export default function ToggleCommentsButton({ show, count, onClick }) {
  return (
    <button onClick={onClick} className={styles.viewCommentsBtn}>
      {show
        ? "Hide comments"
        : `View ${count} ${count === 1 ? "comment" : "comments"}`}
    </button>
  );
}
