"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { mockPosts } from "@/mock/posts";
import { mockScrapbooks } from "@/mock/scrapbooks";
import PostDetailModal from "../../components/PostDetailModal";

// PAGE THAT SHOWS UP WHEN YOU CLICK A SCRAPBOOK

export default function ScrapbookDetailPage() {
  // Grab the scrapbook id from the dynamic route
  const { id } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);
  // Find the scrapbook the page should render
  const scrapbook = mockScrapbooks.find((item) => item.id === id);

  // Resolve the posts belonging to this scrapbook
  const scrapbookPosts = useMemo(() => {
    if (!scrapbook) return [];
    return scrapbook.postIds
      .map((postId) => mockPosts.find((post) => post.id === postId))
      .filter(Boolean);
  }, [scrapbook]);

  const handleDelete = () => {
    console.log("Delete scrapbook clicked:", scrapbook?.id);
  };

  if (!scrapbook) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <h1 className={styles.title}>Scrapbook not found</h1>
          <p className={styles.description}>
            Try returning to your gallery to view all scrapbooks.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.backRow}>
        <Link
          href="/mycontent/my-gallery?tab=scrapbooks"
          className={styles.backLink}
        >
          ← Back to scrapbooks
        </Link>
      </div>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Scrapbook</p>
          <h1 className={styles.title}>{scrapbook.title}</h1>
          <p className={styles.description}>{scrapbook.description}</p>
          <div className={styles.metaRow}>
            <span className={styles.pill}>{scrapbookPosts.length} posts</span>
            <button className={styles.deleteButton} onClick={handleDelete}>
              Delete Scrapbook
            </button>
          </div>
        </div>
        <div className={styles.coverWrap}>
          <img
            src={scrapbook.coverImage}
            alt={scrapbook.title}
            className={styles.coverImage}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.muted}>Collected posts</p>
            <h2 className={styles.sectionTitle}>Inside this scrapbook</h2>
          </div>
        </div>
        <div className={styles.postsGrid}>
          {scrapbookPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              className={styles.postCard}
              // Clicking a post opens it in the shared detail modal
              onClick={() => setSelectedPost(post)}
            >
              <div className={styles.polaroidFrame}>
                <div className={styles.imageWrap}>
                  <img src={post.image} alt={post.title} />
                </div>
                <div className={styles.polaroidFooter}>
                  <span className={styles.postLocation}>{post.location}</span>
                  <span className={styles.dateLabel}>{post.date}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}
