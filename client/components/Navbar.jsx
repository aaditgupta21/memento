"use client";

import Link from "next/link";
import React from "react";
import styles from "./Navbar.module.css";
import { useUser } from "@/context/UserContext";

export default function Navbar() {
  const { user, authenticated, loading } = useUser();
  if (!authenticated || loading) {
    return null; // Don't show navbar if not authenticated or still loading
  }

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
