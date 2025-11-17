"use client";
import React from "react";
import { useState } from "react";
import styles from "./Post.module.css";

export default function Post({ post, user }) {
  // necessary use states for like and comment functionality
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || []);

  const likeCount = likes.length;
  const commentCount = comments.length;
  // no universal state yet, temp state as fallback
  const currentUserId = user?._id ?? null;
  const currentUsername = user?.displayName ?? null;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

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
  }

  // toggle like/unlike on both frontend (optimistic update for speed) and backend (adjusting frontend if needed, but simple logic so shouldn't fail)
  function toggleLike() {
    if (!currentUserId) return; // Prevent liking if no user ID
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
      <header className={styles.header}>
        <img
          src={post.author.avatar}
          alt={post.author.username}
          width={40}
          height={40}
          className={styles.avatar}
        />
        <div>
          <p className={styles.username}>{post.author.displayName}</p>
          {post.location && <p className={styles.postInfo}>{post.location}</p>}
          <p className={styles.postInfo}>
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </header>

      <img
        src={post.images[0].url}
        alt={post.caption}
        className={styles.postImage}
      />

      {post.caption && <h2 className={styles.caption}>{post.caption}</h2>}

      {/* like and comment count */}
      <div className={styles.actions}>
        <button onClick={toggleLike} className={styles.likeBtn}>
          {isLiked ? "Unlike" : "Like"}
        </button>
        <span className={styles.likeCount}>
          <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
        </span>
      </div>

      {commentCount > 0 && (
        <button
          onClick={() => setShowComments(!showComments)}
          className={styles.viewCommentsBtn}
        >
          {showComments
            ? "Hide comments"
            : `View ${commentCount} ${
                commentCount === 1 ? "comment" : "comments"
              }`}
        </button>
      )}

      {/* show comments if toggled */}
      {showComments && (
        <div className={styles.comments}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <span className={styles.commentAuthor}>
                {comment.author.username}
              </span>
              : {comment.text}
            </div>
          ))}
        </div>
      )}

      {/* add comments */}
      <form onSubmit={handleCommentSubmit} className={styles.addCommentForm}>
        <input
          type="text"
          name="comment"
          placeholder="Add a comment..."
          className={styles.commentInput}
        />
        <button type="submit" className={styles.postBtn}>
          Post
        </button>
      </form>
    </article>
  );
}
