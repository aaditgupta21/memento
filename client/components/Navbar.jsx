"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";
import { useUser } from "@/context/UserContext";

import {
  UploadIcon,
  HomeIcon,
  ImageIcon,
  UserIcon,
  SparklesIcon,
  Info,
} from "lucide-react";

export default function Navbar() {
  const { user, authenticated, loading, logout } = useUser();
  const pathname = usePathname();

  const isActive = (href) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  if (!authenticated || loading) {
    return null; // Don't show navbar if not authenticated or still loading
  }

  return (
    <nav className={styles.navbar}>
      <Link href="/feed" className={styles.logo}>
        Memento
      </Link>
      <div className={styles.navLinks}>
        <Link
          href="/feed"
          className={`${styles.navLink} ${
            isActive("/feed") ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <HomeIcon className={styles.navIcon} size={18} />
            Feed
          </span>
        </Link>
        <Link
          href={user?.displayName ? `/${user.displayName}` : "#"}
          className={`${styles.navLink} ${
            user?.displayName && isActive(`/${user.displayName}`) ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <ImageIcon className={styles.navIcon} size={18} />
            My Gallery
          </span>
        </Link>
        <Link
          href="/upload"
          className={`${styles.navLink} ${
            isActive("/upload") ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <UploadIcon className={styles.navIcon} size={18} />
            Upload
          </span>
        </Link>
        <Link
          href="/wrapped"
          className={`${styles.navLink} ${
            isActive("/wrapped") ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <SparklesIcon className={styles.navIcon} size={18} />
            Wrapped
          </span>
        </Link>
        <Link
          href="/help"
          className={`${styles.navLink} ${
            isActive("/help") ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <Info className={styles.navIcon} size={18} />
            Help
          </span>
        </Link>
        <Link
          href="/account"
          className={`${styles.navLink} ${
            isActive("/account") ? styles.active : ""
          }`}
        >
          <span className={styles.navLinkContent}>
            <UserIcon className={styles.navIcon} size={18} />
            Account
          </span>
        </Link>
        <button className={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
