"use client";
import React from "react";
import { useState } from "react";

export default function Post({ post, user }) {
  const likeCount = post.likes.length;

  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);

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
      {/* like and comment count */}
      <div>
        <strong>{likeCount}</strong> {likeCount === 1 ? "like" : "likes"}
      </div>
      {post.commentCount > 0 && (
        <button onClick={() => setShowComments(!showComments)}>
          View all comments
        </button>
      )}
      <h2>{post.caption}</h2>

      {
        /* like button */
        <button
          onClick={() => {
            setLiked(!liked);
            // setLiked updates async, so we use the previous value to update likes array
            if (!liked) {
              post.likes.push(user);
            } else {
              const index = post.likes.indexOf(user);
              if (index > -1) {
                post.likes.splice(index, 1);
              }
            }
          }}
        >
          {liked ? "Unlike" : "Like"}
        </button>
      }

      {/* show comments if toggled */}
      {showComments && (
        <div>
          {post.comments.map((comment) => (
            <div key={comment.id}>
              <strong>{comment.author.username}</strong>: {comment.text}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
