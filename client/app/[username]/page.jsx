"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./gallery.module.css";
import { useEffect, useState, lazy, Suspense } from "react";
import { useUser } from "@/context/UserContext";
const Post = lazy(() => import("@/app/feed/components/post"));
// import Post from "@/app/feed/components/post";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        // Fetch user first to check if it exists
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
          throw new Error("Fetch failed");
        }

        const userData = await userRes.json();

        // If user exists, fetch their posts
        const postsRes = await fetch(
          `${API_BASE}/api/users/username/${username}/posts`,
          {
            credentials: "include",
          }
        );

        if (!postsRes.ok) throw new Error("Failed to fetch posts");

        const postsData = await postsRes.json();

        if (mounted) {
          setProfileUser(userData.user);
          setPosts(postsData.posts || []);
          console.log(postsData.posts);
        }
      } catch (error) {
        console.error(error);
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
  }, [username]);

  if (loading) return <main className={styles.page}>Loading...</main>;

  if (!profileUser) {
    return (
      <main className={styles.page}>
        <h1>404 - User Not Found</h1>
        <p>The user "{username}" does not exist.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* Profile Header */}
      <section className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          {profileUser?.profilePicture ? (
            <Image
              src={profileUser.profilePicture}
              alt={profileUser.displayName}
              width={140}
              height={140}
              className={styles.avatar}
              priority
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {profileUser?.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.displayName}>
            {profileUser?.displayName}'s Memories
          </h1>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{posts.length}</span>
              <span className={styles.statLabel}>
                {posts.length === 1 ? "Memory" : "Memories"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.gallerySection}>
        <h2 className={styles.sectionTitle}>Gallery</h2>
        <div className={styles.gridContainer}>
          {posts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            posts.map((post) => {
              const firstImg = post.images[0];
              return (
                <div
                  key={post._id}
                  className={styles.thumb}
                  onClick={() => setSelectedPost(post)}
                  style={{ cursor: "pointer" }}
                >
                  {firstImg ? (
                    <img
                      src={firstImg.url}
                      alt={post.caption || "Post image"}
                      className={styles.thumbImg}
                    />
                  ) : (
                    <div className={styles.thumbPlaceholder}>No Image</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
      {/* Modal overlay for selected post */}
      {selectedPost && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedPost(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setSelectedPost(null)}
            >
              ×
            </button>
            <Post post={selectedPost} user={user} />
          </div>
        </div>
      )}
    </main>
  );
}
