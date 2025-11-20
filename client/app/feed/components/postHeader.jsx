"use client";

import Image from "next/image";
import styles from "./postHeader.module.css";

export default function PostHeader({ author, location, createdAt }) {
  const profilePicture = author?.profilePicture || author?.avatar || "/default.jpeg";

  return (
    <header className={styles.header}>
      <Image
        src={profilePicture}
        alt={author?.displayName || "User"}
        width={40}
        height={40}
        className={styles.avatar}
      />
      <div>
        <a className={styles.username} href={`/${author.displayName}`}>
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
