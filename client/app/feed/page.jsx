"use client";
import React from "react";
import { mockPosts } from "./mockPosts";
import Post from "./components/post";
import styles from "./Feed.module.css";

export default function Feed({ posts }) {
  const tempUser = { id: "user123", username: "tempUser" };
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Your Feed</h1>
        {mockPosts.map((post) => (
          <Post key={post.id} post={post} user={tempUser} />
        ))}
        <p className={styles.endMessage}>
          {!posts ? "No more memories." : null}
        </p>
      </div>
    </main>
  );
}
