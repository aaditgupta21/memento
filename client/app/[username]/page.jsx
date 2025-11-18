"use client";
import { useParams } from "next/navigation";
import styles from "./gallery.module.css";
import Post from "@/app/feed/components/post";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        // Fetch user first to check if it exists
        const userRes = await fetch(`${API_BASE}/api/users/username/${username}`, {
          credentials: "include",
        });

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
      <h1>{profileUser?.displayName}'s Profile</h1>
      {profileUser?.profilePicture && (
        <img src={profileUser.profilePicture} alt={profileUser.displayName} />
      )}
      <h2>Posts</h2>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        posts.map((post) => <Post key={post._id} post={post} user={user} />)
      )}
    </main>
  );
}

