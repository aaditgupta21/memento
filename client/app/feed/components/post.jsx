"use client";
import React from "react";

export default function Post({ post }) {
  return (
    <article>
      <h2>{post.caption}</h2>
      <p>{post.location}</p>
      <img src={post.imageUrl} alt={post.title} />
    </article>
  );
}
