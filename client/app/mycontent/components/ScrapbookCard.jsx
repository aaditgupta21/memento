"use client";

import styles from "./ScrapbookCard.module.css";

// SCRAPBOOK COVER IMAGE/DETAILS

export default function ScrapbookCard({ title, coverImage, postCount }) {
  return (
    <div className={styles.card}>
      <div className={styles.coverWrapper}>
        <img src={coverImage} alt={title} className={styles.coverImage} />
        <div className={styles.overlay}>
          <span className={styles.postCount}>{postCount} posts</span>
          <h3 className={styles.title}>{title}</h3>
        </div>
      </div>
    </div>
  );
}
