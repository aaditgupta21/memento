"use client";
import React from "react";
import { mockPosts } from "./mockPosts";
import Post from "./components/post";

export default function Feed({ posts }) {
  return (
    <main>
      <h1>Your Feed</h1>
      {mockPosts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      <p>{!posts ? "End of feed." : null}</p>
    </main>
  );
}
