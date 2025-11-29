"use client";
import React from "react";
import { useState, useEffect } from "react";
import { mockPosts } from "./mockPosts";
import Post from "./components/post";
import styles from "./Feed.module.css";
import { useUser } from "@/context/UserContext";

const CATEGORIES = [
  "Travel",
  "Sports",
  "Gaming",
  "Lifestyle",
  "Food",
  "Fitness",
  "Fashion",
  "Beauty",
  "Wellness",
  "Home",
  "Family",
  "Art",
  "Music",
  "Photography",
  "Nature",
];

export default function Feed() {
  const { user } = useUser();

  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [numRendered, setNumRendered] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState(""); // "" = all

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

  // Filter posts by selected category
  const filteredPosts = selectedCategory
    ? feedPosts.filter((post) => post.categories?.includes(selectedCategory))
    : feedPosts;

  const visiblePosts = filteredPosts.slice(0, numRendered);
  const hasMore = numRendered < filteredPosts.length;

  // Reset numRendered when category changes
  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setNumRendered(10);
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Your Feed</h1>

        {/* Category Filter */}
        <div className={styles.filterBar}>
          <label className={styles.filterLabel}>Filter by category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className={styles.loadingText}>Loading...</p>}
        {error && (
          <p style={{ color: "#b00" }}>Error: {error}. Showing fallback.</p>
        )}
        {visiblePosts.map((post) => (
          <Post key={post._id ?? post.id} post={post} user={user} />
        ))}
        <p className={styles.endMessage}>
          {!loading && !filteredPosts.length
            ? selectedCategory
              ? `No posts in "${selectedCategory}" category.`
              : "No more memories."
            : null}
        </p>
        {hasMore && !loading && (
          <button onClick={handleLoadMore} className={styles.loadMoreBtn}>
            Load More
          </button>
        )}

        {!hasMore && filteredPosts.length > 0 && (
          <p className={styles.endMessage}>You've reached the end!</p>
        )}
      </div>
    </main>
  );
}
