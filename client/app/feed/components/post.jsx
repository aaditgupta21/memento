"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Post.module.css";
import PostHeader from "./postHeader";
import PostImage from "./postImage";
import PostActions from "./postActions";
import ToggleCommentsButton from "./toggleCommentButton";
import CommentsList from "./commentsList";
import CommentForm from "./commentForm";
import LikesDialog from "./likesDialog";

export default function Post({ post, user }) {
  const router = useRouter();
  // necessary use states for like and comment functionality
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || []);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const likeCount = likes.length;
  const commentCount = comments.length;
  const currentUserId = user?.id ?? null;
  const currentUsername = user?.displayName ?? null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  // Redirect if no user
  // useEffect(() => {
  //   if (!user) {
  //     router.push("/"); // send to home page
  //   }
  // }, [user, router]);

  // automatically determine if current user has liked post
  const isLiked = likes.some(
    (like) =>
      (typeof like === "object" ? like._id?.toString() : like?.toString()) ===
      currentUserId?.toString()
  );

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const commentText = formData.get("comment");
    if (!commentText) return;

    if (!post._id) {
      console.error("No _id on post, cannot comment.");
      return;
    }

    // Optimistic update
    const tempComment = {
      _id: `temp-${Date.now()}`,
      text: commentText,
      author: {
        _id: currentUserId,
        displayName: currentUsername,
      },
      createdAt: new Date(),
    };
    setComments((prev) => [...prev, tempComment]);
    e.target.reset();
    setShowComments(true);

    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: commentText }),
      });

      if (!res.ok) {
        // Revert optimistic update on error
        setComments((prev) => prev.filter((c) => c._id !== tempComment._id));
        console.error("Failed to submit comment");
      } else {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (err) {
      // Revert optimistic update on error
      setComments((prev) => prev.filter((c) => c._id !== tempComment._id));
      console.error("Error submitting comment:", err);
    }
  }

  // toggle like/unlike on both frontend (optimistic update for speed) and backend (adjusting frontend if needed, but simple logic so shouldn't fail)
  function toggleLike() {
    if (!currentUserId || isLiking) {
      return; // Prevent liking if no user ID or already processing
    }

    setIsLiking(true);
    const wasLiked = isLiked; // capture current state before updating

    setLikes((prevLikes) => {
      if (wasLiked) {
        // meaning already liked, so we remove like
        return prevLikes.filter(
          (like) =>
            (typeof like === "object"
              ? like._id?.toString()
              : like?.toString()) !== currentUserId?.toString()
        );
      } else {
        // add like to array (as ID for now, will be populated on next fetch)
        return [...prevLikes, currentUserId];
      }
    });

    fetch(`${API_BASE}/api/posts/${post._id}/like`, {
      method: wasLiked ? "DELETE" : "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          // Revert on error using captured wasLiked
          setLikes(
            (prev) =>
              wasLiked
                ? [...prev, currentUserId] // re-add if we removed
                : prev.filter(
                    (like) =>
                      (typeof like === "object"
                        ? like._id?.toString()
                        : like?.toString()) !== currentUserId?.toString()
                  ) // remove if we added
          );
          throw new Error("Failed to toggle like");
        }
        return res.json();
      })
      .then((data) => {
        // Update likes with populated data from server
        if (data.likes) {
          setLikes(data.likes);
        }
      })
      .catch((err) => console.error("Like error:", err))
      .finally(() => {
        setIsLiking(false);
      });
  }

  return (
    <article className={styles.post}>
      {/* post header with author info */}
      <PostHeader
        author={post.author}
        location={post.location}
        createdAt={post.createdAt}
      />

      {/* post image(s) */}
      <PostImage
        imageUrls={post.images.map((image) => image.url)}
        caption={post.caption}
      />

      {/* like and comment count */}
      <PostActions
        isLiked={isLiked}
        likeCount={likes.length}
        onToggleLike={toggleLike}
        onLikeCountClick={() => setShowLikesDialog(true)}
        isLiking={isLiking}
      />

      {/* likes dialog */}
      <LikesDialog
        isOpen={showLikesDialog}
        onClose={() => setShowLikesDialog(false)}
        likes={likes}
        postId={post._id}
      />

      {/* toggle comments button */}
      {commentCount > 0 && (
        <ToggleCommentsButton
          show={showComments}
          count={commentCount}
          onClick={() => setShowComments(!showComments)}
        />
      )}

      {/* show comments if toggled */}
      {showComments && <CommentsList comments={comments} />}

      {/* add comments */}
      <CommentForm onSubmit={handleCommentSubmit} />
    </article>
  );
}
