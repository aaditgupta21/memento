"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import styles from "./gallery.module.css";
import ScrapbookCard from "./components/ScrapbookCard";
import CreateScrapbookModal from "./components/CreateScrapbookModal";
import PostDetailModal from "./components/PostDetailModal";
import { useSearchParams, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { mockPosts } from "@/mock/posts";
import { mockScrapbooks } from "@/mock/scrapbooks";

// GALLERY PAGE THAT SHOWS UP WHEN FIRST CLICKED

// Simple tab ids for the gallery switcher
const TABS = {
  POSTS: "posts",
  SCRAPBOOKS: "scrapbooks",
};

function GalleryContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const username = params?.username;
  const { user } = useUser();
  const initialTab =
    searchParams.get("tab") === TABS.SCRAPBOOKS ? TABS.SCRAPBOOKS : TABS.POSTS;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [scrapbooks, setScrapbooks] = useState(mockScrapbooks);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  // Extract first name from profileUser's displayName
  const firstName = profileUser?.displayName
    ? profileUser.displayName.split(" ")[0]
    : username || "My";

  // Fetch user profile and posts based on URL username
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!username) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // First fetch the user profile to get their displayName
        const userRes = await fetch(
          `${API_BASE}/api/users/username/${username}`,
          {
            credentials: "include",
          }
        );

        if (!userRes.ok) {
          if (userRes.status === 404) {
            if (mounted) {
              setProfileUser(null);
              setPosts([]);
              setLoading(false);
            }
            return;
          }
          throw new Error("Failed to fetch user");
        }

        const userData = await userRes.json();

        // Then fetch their posts
        const postsRes = await fetch(
          `${API_BASE}/api/users/username/${username}/posts`,
          {
            credentials: "include",
          }
        );

        if (!postsRes.ok) throw new Error("Failed to fetch posts");

        const postsData = await postsRes.json();
        const fetchedPosts = postsData.posts || [];

        if (mounted) {
          setProfileUser(userData.user);
          setPosts(fetchedPosts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (mounted) {
          setProfileUser(null);
          setPosts([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [username, API_BASE]);

  // Build a new scrapbook object and prepend it to the list
  const handleCreateScrapbook = (payload) => {
    const newScrapbook = {
      id: `s-${Date.now()}`,
      title: payload.title || "Untitled Scrapbook",
      description: payload.description || "",
      coverImage: payload.coverImage || posts[0]?.images?.[0]?.url || "",
      postIds: payload.postIds || [],
    };
    setScrapbooks((prev) => [newScrapbook, ...prev]);
  };

  // Transform API post to format expected by gallery grid display
  const transformPost = (post) => {
    return {
      id: post._id || post.id,
      image: post.images?.[0]?.url || "",
      title: post.caption || "Untitled",
      location: post.location || "",
      date: post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : "",
      // Keep original post for modal (which now handles API format directly)
      originalPost: post,
    };
  };

  // Show 404 if user doesn't exist
  if (!loading && !profileUser && username) {
    return (
      <main className={styles.page}>
        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <h1>404 - User Not Found</h1>
          <p>The user "{username}" does not exist.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{firstName}'s Gallery</p>
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
            <span className={styles.badge}>
              {loading ? "..." : posts.length} items
            </span>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>No posts yet. Start sharing your memories!</p>
            </div>
          ) : (
            <div className={styles.postsGrid}>
              {posts.map((post) => {
                const transformedPost = transformPost(post);
                return (
                  <button
                    key={post._id || post.id}
                    type="button"
                    className={styles.postCard}
                    // Pass original post to modal (which handles API format)
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className={styles.polaroidFrame}>
                      <div className={styles.imageWrap}>
                        <img
                          src={transformedPost.image}
                          alt={transformedPost.title}
                        />
                      </div>
                      <div className={styles.polaroidFooter}>
                        <span className={styles.postLocation}>
                          {transformedPost.location || "No location"}
                        </span>
                        <span className={styles.dateLabel}>
                          {transformedPost.date}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
                href={`/mycontent/scrapbooks/${scrapbook.id}`}
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
        posts={posts.map(transformPost)}
      />
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}

export default function GalleryPage() {
  // Wrap useSearchParams usage to satisfy Next.js CSR bailout requirement
  return (
    <Suspense fallback={<main className={styles.page}>Loading...</main>}>
      <GalleryContent />
    </Suspense>
  );
}
