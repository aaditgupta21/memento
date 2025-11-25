"use client";
import React from "react";
import { useState, useEffect } from "react";
import { mockPosts } from "./mockPosts";
import Post from "./components/post";
import styles from "./Feed.module.css";
import { useUser } from "@/context/UserContext";

export default function Feed() {
  const { user } = useUser();

  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numRendered, setNumRendered] = useState(10); // start with 10 posts

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchPosts() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/posts`);
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const json = await res.json();
        if (mounted) setFeedPosts(json.posts || []);
        console.log(json.posts);
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchPosts();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const handleLoadMore = () => {
    setNumRendered((prev) => prev + 10);
  };

  const visiblePosts = feedPosts.slice(0, numRendered);
  const hasMore = numRendered < feedPosts.length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Your Feed</h1>
        {loading && <p className={styles.loadingText}>Loading...</p>}
        {error && (
          <p style={{ color: "#b00" }}>Error: {error}. Showing fallback.</p>
        )}
        {visiblePosts.map((post) => (
          <Post key={post._id ?? post.id} post={post} user={user} />
        ))}
        <p className={styles.endMessage}>
          {!loading && !feedPosts.length ? "No more memories." : null}
        </p>
        {hasMore && !loading && (
          <button onClick={handleLoadMore} className={styles.loadMoreBtn}>
            Load More
          </button>
        )}

        {!hasMore && feedPosts.length > 0 && (
          <p className={styles.endMessage}>You've reached the end!</p>
        )}
      </div>
    </main>
  );
}
