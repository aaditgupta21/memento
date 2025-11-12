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
  const currentUserId = user ? user.id : "tempUserId";
  const currentUsername = user ? user.displayName : "tempUser";

  // automatically determine if current user has liked post
  const isLiked = likes.includes(currentUserId);

  async function handleSubmit(e) {
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

  function toggleLike() {
    setLikes((prevLikes) => {
      if (isLiked) {
        // meaning already liked, so we remove like
        return prevLikes.filter((like) => like !== currentUserId);
      } else {
        // add like to array
        return [...prevLikes, currentUserId];
      }
    });
    // API call to update like status
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
          <p className={styles.username}>{post.author.username}</p>
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
        src={post.imageUrl}
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
      <form onSubmit={handleSubmit} className={styles.addCommentForm}>
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
