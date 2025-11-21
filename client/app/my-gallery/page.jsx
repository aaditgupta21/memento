"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import ScrapbookCard from "@/components/ScrapbookCard";
import CreateScrapbookModal from "@/components/CreateScrapbookModal";
import PostDetailModal from "@/components/PostDetailModal";
import { useSearchParams } from "next/navigation";
import { mockPosts } from "@/mock/posts";
import { mockScrapbooks } from "@/mock/scrapbooks";

// GALLERY PAGE THAT SHOWS UP WHEN FIRST CLICKED

// Simple tab ids for the gallery switcher
const TABS = {
  POSTS: "posts",
  SCRAPBOOKS: "scrapbooks",
};

export default function MyGalleryPage() {
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === TABS.SCRAPBOOKS ? TABS.SCRAPBOOKS : TABS.POSTS;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [scrapbooks, setScrapbooks] = useState(mockScrapbooks);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Build a new scrapbook object and prepend it to the list
  const handleCreateScrapbook = (payload) => {
    const newScrapbook = {
      id: `s-${Date.now()}`,
      title: payload.title || "Untitled Scrapbook",
      description: payload.description || "",
      coverImage: payload.coverImage || mockPosts[0]?.image,
      postIds: payload.postIds || [],
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
          {/* Manual tab buttons; we keep local state only to avoid routing changes */}
          <div className={styles.tabRow}>
            <button
              className={`${styles.tabButton} ${activeTab === TABS.POSTS ? styles.tabActive : ""
                }`}
              onClick={() => setActiveTab(TABS.POSTS)}
            >
              Posts
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === TABS.SCRAPBOOKS ? styles.tabActive : ""
                }`}
              onClick={() => setActiveTab(TABS.SCRAPBOOKS)}
            >
              Scrapbooks
            </button>
          </div>
        </div>
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
                // Set the current post for the detail modal
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
                // Keep using a Link for client-side navigation to detail pages
              >
                <ScrapbookCard
                  title={scrapbook.title}
                  coverImage={scrapbook.coverImage}
                  postCount={(scrapbook.postIds || []).length}
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
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}
