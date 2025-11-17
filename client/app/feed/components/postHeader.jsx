"use client";

import styles from "./postHeader.module.css";

export default function PostHeader({ author, location, createdAt }) {
  return (
    <header className={styles.header}>
      {/* later have a default pfp if none exists */}
      <img
        src={author.avatar}
        alt={author.displayName}
        width={40}
        height={40}
        className={styles.avatar}
      />
      <div>
        <a className={styles.username} href={`/profile/${author._id}`}>
          {author.displayName}
        </a>
        {location && <p className={styles.postInfo}>{location}</p>}
        <p className={styles.postInfo}>
          {new Date(createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </header>
  );
}
