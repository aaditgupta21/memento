"use client";
import React from "react";
import { useState } from "react";

export default function Post({ post, user }) {
  // necessary use states for like and comment functionality
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [likes, setLikes] = useState(post.likes || []);

  const likeCount = likes.length;
  const currentUserId = user.id;
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
      author: { id: currentUserId, username: user.username },
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
    <article>
      <header>
        <img
          src={post.author.avatar}
          alt={post.author.username}
          width={80}
          height={80}
          style={{ borderRadius: "50%" }}
        />
        <div>
          <p>{post.author.username}</p>
          {post.location && <p>{post.location}</p>}
        </div>
      </header>
      <img src={post.imageUrl} alt={post.caption} />
      <h2>{post.caption}</h2>
      {/* like and comment count */}
      <div>
        <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
      </div>
      {post.commentCount > 0 && (
        <button onClick={() => setShowComments(!showComments)}>
          View all comments
        </button>
      )}

      {/* show comments if toggled */}
      {showComments && (
        <div>
          {comments.map((comment) => (
            <div key={comment.id}>
              <strong>{comment.author.username}</strong>: {comment.text}
            </div>
          ))}
        </div>
      )}

      {/* add comments */}
      <form onSubmit={handleSubmit}>
        <input type="text" name="comment" placeholder="Add a comment..." />
        <button type="submit">Post</button>
      </form>

      {
        /* like button */
        <button onClick={toggleLike}>{isLiked ? "Unlike" : "Like"}</button>
      }
    </article>
  );
}
