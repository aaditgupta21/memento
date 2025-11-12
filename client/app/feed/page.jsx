"use client";
import React from "react";
import { mockPosts } from "./mockPosts";
import Post from "./components/post";
import styles from "./Feed.module.css";
import { useUser } from "@/context/UserContext";

export default function Feed({ posts }) {
  const { user } = useUser();
  console.log(user);
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Your Feed</h1>
        {mockPosts.map((post) => (
          <Post key={post.id} post={post} user={user} />
        ))}
        <p className={styles.endMessage}>
          {!posts ? "No more memories." : null}
        </p>
      </div>
    </main>
  );
}
