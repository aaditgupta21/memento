"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, HeartIcon, MapPinIcon, SparklesIcon } from "lucide-react";

import { useUser } from "@/context/UserContext";
import styles from "./Wrapped.module.css";
import ActivityHeatmap from "./ActivityHeatmap";
import PostModal from "@/app/[username]/components/PostModal";

const DEFAULT_TOP_MEMORIES = [
  {
    images: [
      {
        url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
      },
    ],
  },
  {
    images: [
      {
        url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
      },
    ],
  },
  {
    images: [
      {
        url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400",
      },
    ],
  },
  {
    images: [
      {
        url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400",
      },
    ],
  },
];
export default function Wrapped() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [memoriesCaptured, setMemoriesCaptured] = useState(0);
  const [heartsReceived, setHeartsReceived] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const activityYear = new Date().getFullYear();
  const [selectedPost, setSelectedPost] = useState(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  // Redirect to home page if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let mounted = true;

    async function fetchPostStats() {
      if (!user?.displayName) {
        setPosts([]);
        setMemoriesCaptured(0);
        setHeartsReceived(0);
        setLoadingStats(false);
        return;
      }

      setLoadingStats(true);

      try {
        const postsRes = await fetch(
          `${API_BASE}/api/users/username/${user.displayName}/posts`,
          {
            credentials: "include",
          }
        );

        if (!postsRes.ok) throw new Error("Failed to fetch posts");

        const postsData = await postsRes.json();
        const fetchedPosts = postsData.posts || [];

        if (!mounted) return;

        const totalHearts = fetchedPosts.reduce(
          (sum, post) => sum + (post.likes?.length || 0),
          0
        );

        setPosts(fetchedPosts);
        setMemoriesCaptured(fetchedPosts.length);
        setHeartsReceived(totalHearts);
      } catch (error) {
        console.error("Error fetching wrapped stats:", error);
        if (mounted) {
          setPosts([]);
          setMemoriesCaptured(0);
          setHeartsReceived(0);
        }
      } finally {
        if (mounted) setLoadingStats(false);
      }
    }

    fetchPostStats();
    return () => {
      mounted = false;
    };
  }, [user?.displayName, API_BASE]);

  const stats = [
    {
      label: "Memories Captured",
      value: loadingStats ? "..." : memoriesCaptured.toLocaleString("en-US"),
      icon: ImageIcon,
    },
    {
      label: "Hearts Received",
      value: loadingStats ? "..." : heartsReceived.toLocaleString("en-US"),
      icon: HeartIcon,
    },
    {
      label: "Places Visited",
      value: loadingStats
        ? "..."
        : new Set(
            posts
              .map((post) =>
                typeof post.location === "string"
                  ? post.location.trim().toLowerCase()
                  : ""
              )
              .filter(Boolean)
          ).size.toLocaleString("en-US"),
      icon: MapPinIcon,
    },
    {
      label: "Most Active Month",
      value: loadingStats
        ? "..."
        : (() => {
            if (!posts.length) return "—";
            const monthCounts = posts.reduce((acc, post) => {
              const date = post.createdAt ? new Date(post.createdAt) : null;
              if (date && !isNaN(date)) {
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                acc[monthKey] = (acc[monthKey] || 0) + 1;
              }
              return acc;
            }, {});

            const topMonth = Object.entries(monthCounts).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0];

            if (!topMonth) return "—";

            const [year, monthIndex] = topMonth.split("-").map(Number);
            return new Date(year, monthIndex, 1).toLocaleString("en-US", {
              month: "long",
            });
          })(),
      icon: SparklesIcon,
    },
  ];

  // Show nothing while loading or redirecting
  if (loading || !user) return null;

  const topMemories = useMemo(() => {
    return posts
      .filter((post) => post.images && post.images.length > 0)
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 4)
      .map((post) => post);
  }, [posts]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your {activityYear} Wrapped</h1>
          <p className={styles.subtitle}>A year of beautiful memories</p>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={styles.statCard}>
                <div className={styles.statIconWrapper}>
                  <Icon className={styles.statIcon} size={28} />
                </div>
                <p className={styles.statValue}>{stat.value}</p>
                <p className={styles.statLabel}>{stat.label}</p>
              </div>
            );
          })}
        </div>
        <ActivityHeatmap
          posts={posts}
          loading={loadingStats}
          year={activityYear}
        />

        <div className={styles.topMomentsCard}>
          <h2 className={styles.sectionTitle}>Your Top Moments</h2>

          {!loadingStats && posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p style={{ fontSize: "1.1rem", color: "#666" }}>No posts</p>
            </div>
          ) : (
            <div className={styles.memoryGrid}>
              {(topMemories.length ? topMemories : DEFAULT_TOP_MEMORIES).map(
                (post, index) => (
                  <div
                    key={index}
                    className={styles.memoryImgWrapper}
                    onClick={() => setSelectedPost(post)}
                  >
                    <img
                      src={post.images[0].url}
                      alt={`Top memory ${index + 1}`}
                      className={styles.memoryImg}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {selectedPost && (
          <PostModal
            selectedPost={selectedPost}
            user={user}
            onClose={() => setSelectedPost(null)}
          />
        )}

        <div className={styles.footerCard}>
          <p className={styles.quote}>
            "The best moments are the ones we remember forever"
          </p>
          <p className={styles.quoteSub}>
            Here's to another year of beautiful memories ahead ✨
          </p>
        </div>
      </div>
    </div>
  );
}
