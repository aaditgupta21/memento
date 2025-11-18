"use client";
import { useParams } from "next/navigation";
import styles from "./profile.module.css";
import Post from "@/app/feed/components/post";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

export default function UserProfilePage() {
  const { userID } = useParams();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        // Fetch user and posts in parallel
        const [userRes, postsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users/${userID}`, { credentials: "include" }),
          fetch(`${API_BASE}/api/users/${userID}/posts`, {
            credentials: "include",
          }),
        ]);

        if (!userRes.ok || !postsRes.ok) throw new Error("Fetch failed");

        const [userData, postsData] = await Promise.all([
          userRes.json(),
          postsRes.json(),
        ]);

        if (mounted) {
          setProfileUser(userData.user);
          setPosts(postsData.posts || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [userID]);

  if (loading) return <main className={styles.page}>Loading...</main>;

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
