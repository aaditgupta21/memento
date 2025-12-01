"use client";

import React, { useState, useEffect, useMemo } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import { useUser } from "@/context/UserContext";
import { ClusteredMarkers } from "./ClusteredMarkers";
import PostDetailModal from "../[username]/components/PostDetailModal";
import styles from "./map.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MapPage() {
  const [posts, setPosts] = useState([]);
  const [photoLocations, setPhotoLocations] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(5);
  const { user, loading: userLoading } = useUser();

  // Fetch user-specific data
  useEffect(() => {
    const fetchMapData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch posts with geolocation
        const postsRes = await fetch(
          `${API_BASE}/api/posts?author=${user.id}`,
          { credentials: "include" }
        );
        const postsData = await postsRes.json();

        if (postsData.success) {
          // Keep all posts - we'll extract location from EXIF if geolocation is missing
          setPosts(postsData.posts || []);
        }

        // Fetch photo locations from EXIF
        const photosRes = await fetch(
          `${API_BASE}/api/posts/photo-locations?userId=${user.id}`,
          { credentials: "include" }
        );
        const photosData = await photosRes.json();

        if (photosData.success) {
          setPhotoLocations(photosData.photoLocations || []);
        }
      } catch (err) {
        console.error("Failed to fetch map data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();
  }, [user]);

  // Transform data into unified points array
  const points = useMemo(() => {
    const allPoints = [];

    // Add posts that have geolocation in the Post schema
    posts.forEach((post) => {
      if (post.geolocation?.lat && post.geolocation?.lng) {
        allPoints.push({
          id: `post-${post._id}`,
          type: "post",
          lat: post.geolocation.lat,
          lng: post.geolocation.lng,
          imageUrl: post.images[0]?.url,
          post: post,
        });
      }
    });

    // Add photo-level locations from EXIF (individual photos within posts)
    photoLocations.forEach((photo, idx) => {
      allPoints.push({
        id: `photo-${photo.postId}-${idx}`,
        type: "photo",
        lat: photo.coordinates[1],
        lng: photo.coordinates[0],
        imageUrl: photo.imageUrl,
        postId: photo.postId,
      });
    });

    // For posts without geolocation, try to use first photo's EXIF location
    posts.forEach((post) => {
      if (!post.geolocation?.lat || !post.geolocation?.lng) {
        // Find photo locations for this post
        const postPhotos = photoLocations.filter(p => p.postId?.toString() === post._id?.toString());
        if (postPhotos.length > 0) {
          // Use first photo's location for the post marker
          allPoints.push({
            id: `post-fallback-${post._id}`,
            type: "post",
            lat: postPhotos[0].coordinates[1],
            lng: postPhotos[0].coordinates[0],
            imageUrl: post.images[0]?.url,
            post: post,
          });
        }
      }
    });

    return allPoints;
  }, [posts, photoLocations]);

  // Handle point click
  const handlePointClick = async (point) => {
    if (point.type === "post" && point.post) {
      setSelectedPost(point.post);
    } else if (point.type === "photo" && point.postId) {
      // Fetch full post for this photo
      const post = posts.find((p) => p._id === point.postId);
      if (post) {
        setSelectedPost(post);
      }
    }
  };

  if (userLoading || loading) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <p>Loading your photos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.authPrompt}>
          <p>Please log in to view your map</p>
          <a href="/login">Log In</a>
        </div>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{ padding: 20 }}>
        Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in client/.env
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className={styles.mapContainer}>
        <Map
          defaultCenter={{ lat: 37, lng: -95 }}
          defaultZoom={4}
          mapId="memento-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          onZoomChanged={(e) => setZoom(e.detail.zoom)}
        >
          <ClusteredMarkers
            points={points}
            onPointClick={handlePointClick}
            zoom={zoom}
          />
        </Map>

        {selectedPost && (
          <PostDetailModal
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </div>
    </APIProvider>
  );
}
