"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./post.module.css";
import PostHeader from "./postHeader";
import PostImage from "./postImage";
import PostActions from "./postActions";
import ToggleCommentsButton from "./toggleCommentButton";
import CommentsList from "./commentsList";
import CommentForm from "./commentForm";

export default function Post({ post, user }) {
  const router = useRouter();
  // necessary use states for like and comment functionality
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || []);

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
  const isLiked = likes.includes(currentUserId);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const commentText = formData.get("comment");
    if (!commentText) return;
    const newComment = {
      id: `c${comments.length + 1}`,
      text: commentText,
      author: { id: currentUserId, username: currentUsername },
    };
    setComments((prev) => [...prev, newComment]);
    e.target.reset();
    setShowComments(true);

    // API call to submit comment
    // const res = await fetch(`${API_BASE}/api/posts/${post._id}/comments`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   credentials: "include",
    //   body: JSON.stringify({ text: commentText }),
    // });
    // if (!post._id) {
    //   console.error("No _id on post, cannot comment.");
    //   return;
    // }

    // if (!res.ok) {
    //   console.error("Failed to submit comment");
    // } else {
    //   const data = await res.json();
    //   setComments(data.comments);
    // }
  }

  // toggle like/unlike on both frontend (optimistic update for speed) and backend (adjusting frontend if needed, but simple logic so shouldn't fail)
  function toggleLike() {
    if (!currentUserId) {
      return; // Prevent liking if no user ID
    }
    const wasLiked = isLiked; // capture current state before updating

    setLikes((prevLikes) => {
      if (wasLiked) {
        // meaning already liked, so we remove like
        return prevLikes.filter((like) => like !== currentUserId);
      } else {
        // add like to array
        return [...prevLikes, currentUserId];
      }
    });
    console.log(likes);

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
                : prev.filter((id) => id !== currentUserId) // remove if we added
          );
          throw new Error("Failed to toggle like");
        }
        return res.json();
      })
      .catch((err) => console.error("Like error:", err));
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
