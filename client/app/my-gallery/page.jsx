"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ScrapbookCard from "@/components/ScrapbookCard";
import CreateScrapbookModal from "@/components/CreateScrapbookModal";
import GalleryPostModal from "@/components/GalleryPostModal";
import { mockPosts } from "@/mock/posts";
import { mockScrapbooks } from "@/mock/scrapbooks";

const TABS = {
  POSTS: "posts",
  SCRAPBOOKS: "scrapbooks",
};

export default function MyGalleryPage() {
  const [activeTab, setActiveTab] = useState(TABS.POSTS);
  const [scrapbooks, setScrapbooks] = useState(mockScrapbooks);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const featuredPost = useMemo(() => mockPosts[0], []);

  const handleCreateScrapbook = (payload) => {
    const newScrapbook = {
      id: `s-${Date.now()}`,
      title: payload.title || "Untitled Scrapbook",
      description: payload.description || "",
      coverImage: payload.coverImage || featuredPost?.image,
      postIds: payload.postIds || [],
      postCount: (payload.postIds || []).length || 1,
    };
    setScrapbooks((prev) => [newScrapbook, ...prev]);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>My Gallery</p>
          <h1 className={styles.title}>Memories & Scrapbooks</h1>
          <p className={styles.subtitle}>
            Keep your favorite posts together with soft, keepsake-ready sets.
          </p>
          <div className={styles.tabRow}>
            <button
              className={`${styles.tabButton} ${
                activeTab === TABS.POSTS ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(TABS.POSTS)}
            >
              Posts
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === TABS.SCRAPBOOKS ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(TABS.SCRAPBOOKS)}
            >
              Scrapbooks
            </button>
          </div>
        </div>
        {featuredPost && (
          <div className={styles.heroBadge}>
            <img
              src={featuredPost.image}
              alt={featuredPost.title}
              className={styles.heroImage}
            />
            <div className={styles.heroMeta}>
              <span className={styles.heroLabel}>Featured</span>
              <p className={styles.heroText}>{featuredPost.title}</p>
            </div>
          </div>
        )}
      </section>

      {activeTab === TABS.POSTS ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.muted}>Daily memories</p>
              <h2 className={styles.sectionTitle}>All Posts</h2>
            </div>
            <span className={styles.badge}>{mockPosts.length} items</span>
          </div>
          <div className={styles.postsGrid}>
            {mockPosts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={styles.postCard}
                onClick={() => setSelectedPost(post)}
              >
                <div className={styles.imageWrap}>
                  <img src={post.image} alt={post.title} />
                  <div className={styles.postOverlay}>
                    <span className={styles.postLocation}>{post.location}</span>
                    <p className={styles.postTitle}>{post.title}</p>
                  </div>
                </div>
                <div className={styles.postFooter}>
                  <span className={styles.dateLabel}>{post.date}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.muted}>Curated sets</p>
              <h2 className={styles.sectionTitle}>Scrapbooks</h2>
            </div>
            <button
              className={styles.primaryButton}
              onClick={() => setModalOpen(true)}
            >
              + Create Scrapbook
            </button>
          </div>
          <div className={styles.scrapbookGrid}>
            {scrapbooks.map((scrapbook) => (
              <Link
                key={scrapbook.id}
                href={`/scrapbooks/${scrapbook.id}`}
                className={styles.cardLink}
              >
                <ScrapbookCard
                  title={scrapbook.title}
                  coverImage={scrapbook.coverImage}
                  postCount={scrapbook.postCount}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      <CreateScrapbookModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateScrapbook}
        posts={mockPosts}
      />
      <GalleryPostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}
