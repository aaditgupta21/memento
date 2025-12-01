"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./gallery.module.css";
import ScrapbookCard from "./components/ScrapbookCard";
import CreateScrapbookModal from "./components/CreateScrapbookModal";
import PostDetailModal from "./components/PostDetailModal";
import { useSearchParams, useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";

// GALLERY PAGE THAT SHOWS UP WHEN FIRST CLICKED

// Simple tab ids for the gallery switcher
const TABS = {
  POSTS: "posts",
  SCRAPBOOKS: "scrapbooks",
  ALBUMS: "albums",
};

function AlbumDetailModal({ album, onClose }) {
  if (!album) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} type="button" onClick={onClose}>
          ×
        </button>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.muted}>{album.level || "Location album"}</p>
            <h2 className={styles.title}>{album.title || album.name}</h2>
            <p className={styles.metaLine}>
              {album.photoCount || album.photos?.length || 0} photos •{" "}
              {album.dateRange || "Unknown date"}
            </p>
          </div>
        </div>
        <div className={styles.albumPhotosGrid}>
          {album.photos?.map((photo, idx) => (
            <div key={photo.url || idx} className={styles.albumPhotoCard}>
              <img src={photo.url} alt={photo.caption || album.title} />
              <div className={styles.albumPhotoMeta}>
                <span>{photo.location || album.title || "Unknown"}</span>
                {photo.timestamp ? (
                  <span>
                    {new Date(photo.timestamp).toLocaleDateString("en-US")}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const username = params?.username;
  const { user, loading: userLoading } = useUser();
  const initialTab =
    searchParams.get("tab") === TABS.SCRAPBOOKS ? TABS.SCRAPBOOKS : TABS.POSTS;

  const [activeTab, setActiveTab] = useState(initialTab);
  const [scrapbooks, setScrapbooks] = useState([]);
  const [locationAlbums, setLocationAlbums] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingScrapbooks, setLoadingScrapbooks] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Get first name from database
  const firstName = profileUser?.firstName || profileUser?.displayName || "My";

  // Check if current user is viewing their own gallery
  const isOwnGallery = user?.displayName === username;

  // Redirect to home page if not logged in
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/");
    }
  }, [userLoading, user, router]);

  // Fetch user profile and posts based on URL username
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!username) {
        setPosts([]);
        setLoading(false);
        setLocationAlbums([]);
        setLoadingAlbums(false);
        return;
      }

      try {
        setLoading(true);
        setLoadingAlbums(true);

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

        // Fetch scrapbooks
        const scrapbooksRes = await fetch(
          `${API_BASE}/api/users/username/${username}/scrapbooks`,
          {
            credentials: "include",
          }
        );

        let fetchedScrapbooks = [];
        if (scrapbooksRes.ok) {
          const scrapbooksData = await scrapbooksRes.json();
          fetchedScrapbooks = scrapbooksData.scrapbooks || [];
        }

        // Fetch location albums
        let fetchedAlbums = [];
        try {
          const albumsRes = await fetch(
            `${API_BASE}/api/location-albums/users/username/${username}/location-albums`,
            { credentials: "include" }
          );
          if (albumsRes.ok) {
            const albumsData = await albumsRes.json();
            fetchedAlbums = albumsData.albums || [];
          }
        } catch (err) {
          console.warn("Failed to load location albums", err);
        }

        if (mounted) {
          setProfileUser(userData.user);
          setPosts(fetchedPosts);
          setScrapbooks(fetchedScrapbooks);
          setLocationAlbums(fetchedAlbums);
          setLoadingScrapbooks(false);
          setLoadingAlbums(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (mounted) {
          setProfileUser(null);
          setPosts([]);
          setScrapbooks([]);
          setLocationAlbums([]);
          setLoadingScrapbooks(false);
          setLoadingAlbums(false);
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

  // Show nothing while loading or redirecting
  if (userLoading || !user) return null;

  // Handle new scrapbook creation (called from modal after API success)
  const handleCreateScrapbook = (newScrapbook) => {
    // The scrapbook is already created in the backend, just add it to the list
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
            <button
              className={`${styles.tabButton} ${
                activeTab === TABS.ALBUMS ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(TABS.ALBUMS)}
            >
              Albums
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
      ) : activeTab === TABS.SCRAPBOOKS ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.muted}>Curated sets</p>
              <h2 className={styles.sectionTitle}>Scrapbooks</h2>
            </div>
            {isOwnGallery && (
              <button
                className={styles.primaryButton}
                onClick={() => setModalOpen(true)}
              >
                + Create Scrapbook
              </button>
            )}
          </div>
          <div className={styles.scrapbookGrid}>
            {scrapbooks.map((scrapbook) => {
              const scrapbookId = scrapbook._id || scrapbook.id;
              const postCount =
                scrapbook.posts?.length || scrapbook.postIds?.length || 0;
              // Use coverImage from scrapbook, fallback to first post image only if coverImage is missing
              const coverImage =
                scrapbook.coverImage ||
                scrapbook.posts?.[0]?.images?.[0]?.url ||
                "";
              return (
                <Link
                  key={scrapbookId}
                  href={`/scrapbooks/${scrapbookId}`}
                  className={styles.cardLink}
                  // Keep using a Link for client-side navigation to detail pages
                >
                  <ScrapbookCard
                    title={scrapbook.title}
                    coverImage={coverImage}
                    postCount={postCount}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.muted}>Geotagged clusters</p>
              <h2 className={styles.sectionTitle}>Location Albums</h2>
            </div>
            <span className={styles.badge}>
              {loadingAlbums ? "..." : locationAlbums.length} albums
            </span>
          </div>
          {loadingAlbums ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              Loading albums...
            </div>
          ) : locationAlbums.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>No geotagged photos yet.</p>
              <p style={{ color: "#a18f7f" }}>
                Add photos with GPS/EXIF data to see albums by location.
              </p>
            </div>
          ) : (
            <div className={styles.albumGrid}>
              {locationAlbums.map((album) => (
                <button
                  key={album._id || album.id || album.boundaryId}
                  type="button"
                  className={styles.albumCard}
                  onClick={() => setSelectedAlbum(album)}
                >
                  <div className={styles.albumCover}>
                    <img
                      src={album.coverImage || album.photos?.[0]?.url || ""}
                      alt={album.title || "Album cover"}
                    />
                  </div>
                  <div className={styles.albumMeta}>
                    <h3>{album.title || album.name}</h3>
                    <p className={styles.metaLine}>
                      {album.level || "Location"} •{" "}
                      {album.photoCount || album.photos?.length || 0} photos
                    </p>
                    <p className={styles.metaLine}>
                      {album.dateRange || "Unknown date"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {isOwnGallery && (
        <CreateScrapbookModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={handleCreateScrapbook}
          posts={posts}
        />
      )}
      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
      <AlbumDetailModal
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
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
