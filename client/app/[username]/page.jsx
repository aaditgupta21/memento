"use client";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./gallery.module.css";
import { useEffect, useState, lazy, Suspense } from "react";
import { useUser } from "@/context/UserContext";
import PostModal from "./components/PostModal";
import ProfileHeader from "./components/ProfileHeader";
import GallerySection from "./components/GallerySection";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // local host for now
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
      {/* Profile Header with user information */}
      <ProfileHeader profileUser={profileUser} postsCount={posts.length} />

      {/* Actual mapping of the gallery */}
      <GallerySection
        posts={posts}
        onPostClick={(post) => setSelectedPost(post)}
      />
      {/* Modal overlay for selected post, only renders if selectPost exists */}
      <PostModal
        selectedPost={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
      />
    </main>
  );
}
