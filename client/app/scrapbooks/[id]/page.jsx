"use client";

import Link from "next/link";
import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import styles from "./page.module.css";
import PostDetailModal from "@/app/[username]/components/PostDetailModal";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

// PAGE THAT SHOWS UP WHEN YOU CLICK A SCRAPBOOK

function ScrapbookDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [selectedPost, setSelectedPost] = useState(null);
  const [scrapbook, setScrapbook] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to home page if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/");
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    let mounted = true;

    async function fetchScrapbook() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/scrapbooks/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 404) {
            if (mounted) {
              setScrapbook(null);
              setLoading(false);
            }
            return;
          }
          throw new Error("Failed to fetch scrapbook");
        }

        const data = await res.json();
        if (mounted) {
          setScrapbook(data.scrapbook);
        }
      } catch (error) {
        console.error("Error fetching scrapbook:", error);
        if (mounted) {
          setScrapbook(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) {
      fetchScrapbook();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this scrapbook?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/scrapbooks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete scrapbook");
      }

      // Redirect back to user's gallery
      const scrapbookAuthor = scrapbook?.author?.displayName;
      if (scrapbookAuthor) {
        router.push(`/${scrapbookAuthor}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting scrapbook:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Show nothing while loading or redirecting
  if (userLoading || !user) return null;

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <p>Loading scrapbook...</p>
        </div>
      </main>
    );
  }

  if (!scrapbook) {
    return (
      <main className={styles.page}>
        <div className={styles.emptyState}>
          <h1 className={styles.title}>Scrapbook not found</h1>
          <p className={styles.description}>
            Try returning to the gallery to view all scrapbooks.
          </p>
        </div>
      </main>
    );
  }

  const scrapbookPosts = scrapbook.posts || [];
  const authorUsername = scrapbook.author?.displayName;

  return (
    <main className={styles.page}>
      <div className={styles.backRow}>
        <Link
          href={authorUsername ? `/${authorUsername}` : "/"}
          className={styles.backLink}
        >
          ← Back to gallery
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
        {scrapbookPosts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>No posts in this scrapbook yet.</p>
          </div>
        ) : (
          <div className={styles.postsGrid}>
            {scrapbookPosts.map((post) => {
              const postImage = post.images?.[0]?.url || "";
              const postTitle = post.caption || "Untitled";
              const postLocation = post.location || "";
              const postDate = post.createdAt
                ? new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : "";

              return (
                <button
                  key={post._id || post.id}
                  type="button"
                  className={styles.postCard}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className={styles.polaroidFrame}>
                    <div className={styles.imageWrap}>
                      <img src={postImage} alt={postTitle} />
                    </div>
                    <div className={styles.polaroidFooter}>
                      <span className={styles.postLocation}>
                        {postLocation || "No location"}
                      </span>
                      <span className={styles.dateLabel}>{postDate}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}

export default function ScrapbookDetailPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading...</main>}>
      <ScrapbookDetailContent />
    </Suspense>
  );
}

