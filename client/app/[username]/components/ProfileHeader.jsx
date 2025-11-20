"use client";
import Image from "next/image";
import styles from "./ProfileHeader.module.css";

export default function ProfileHeader({ profileUser, postsCount }) {
  return (
    <section className={styles.profileHeader}>
      <div className={styles.avatarContainer}>
        <Image
          src={profileUser.profilePicture || "/default.jpeg"}
          alt={profileUser.displayName}
          width={140}
          height={140}
          className={styles.avatar}
          priority
        />
      </div>
      <div className={styles.profileInfo}>
        <h1 className={styles.displayName}>
          {profileUser?.firstName}'s Memories
        </h1>
        <span className={styles.username}>@{profileUser.displayName}</span>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{postsCount}</span>
            <span className={styles.statLabel}>
              {postsCount === 1 ? "Memory" : "Memories"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
