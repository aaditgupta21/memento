import Link from "next/link";
import React from "react";
import styles from "./Navbar.module.css";

export default function Navbar({ user }) {
  if (!user) return null;
  return (
    <nav className={styles.navbar}>
      <h1 className={styles.logo}>Memento</h1>
      <div className={styles.navLinks}>
        <Link href="/feed" className={styles.navLink}>
          Feed
        </Link>
        <Link href="/gallery" className={styles.navLink}>
          Gallery
        </Link>
        <Link href="/upload" className={styles.navLink}>
          Upload
        </Link>
        <Link href="/wrapped" className={styles.navLink}>
          Wrapped
        </Link>
        <Link href="/account" className={styles.navLink}>
          Account
        </Link>
        <button className={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}
