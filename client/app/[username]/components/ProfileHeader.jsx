"use client";
import Image from "next/image";
import styles from "./ProfileHeader.module.css";

export default function ProfileHeader({
  profileUser,
  postsCount,
  variant = "default",
}) {
  const headerClass =
    variant === "modal"
      ? `${styles.profileHeader} ${styles.modalVariant}`
      : styles.profileHeader;
  const avatarClass =
    variant === "modal"
      ? `${styles.avatar} ${styles.modalAvatar}`
      : styles.avatar;

  return (
    <section className={headerClass}>
      <div className={styles.avatarContainer}>
        <Image
          src={profileUser.profilePicture || "/default.jpeg"}
          alt={profileUser.displayName}
          width={140}
          height={140}
          className={avatarClass}
          priority
        />
      </div>
      <div className={styles.profileInfo}>
        <h1 className={styles.displayName}>
          {profileUser?.displayName}'s Memories
        </h1>
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
