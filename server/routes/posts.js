const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const { ALLOWED_CATEGORIES } = require("../constants");

// Create post endpoint
router.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { images, caption, location, categories } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    // Validate categories if provided

    let safeCategories = [];
    if (Array.isArray(categories)) {
      safeCategories = categories
        .map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter((c) => ALLOWED_CATEGORIES.includes(c));
    }

    // Create post in database
    const post = await Post.create({
      images: images.map((img, idx) => ({
        url: typeof img === "string" ? img : img.url,
        order:
          typeof img === "object" && img.order !== undefined ? img.order : idx,
      })),
      caption: caption ? caption.trim() : "",
      location: location ? location.trim() : undefined,
      categories: safeCategories,
      author: req.user._id,
    });

    // Populate author info
    await post.populate("author", "displayName email");

    res.status(201).json({
      success: true,
      post,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "displayName email profilePicture")
      .populate({
        path: "comments.author",
        select: "displayName email profilePicture",
      })
      .populate({
        path: "likes",
        select: "displayName email profilePicture",
      });

    return res.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Like a post
router.post("/:postId/like", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;
    const index = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    // Populate likes with user info
    await post.populate({
      path: "likes",
      select: "displayName email profilePicture",
    });

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Unlike a post
router.delete("/:postId/like", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;
    const index = post.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (index !== -1) {
      post.likes.splice(index, 1);
      await post.save();
    }

    // Populate likes with user info
    await post.populate({
      path: "likes",
      select: "displayName email profilePicture",
    });

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error("Error unliking post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add comment to a post
router.post("/:postId/comments", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const { postId } = req.params;
  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  const text = (req.body.text || "").trim();
  if (!text) return res.status(400).json({ error: "Comment text required" });

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Create comment using proper schema structure
    const newComment = {
      text,
      author: req.user._id,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate author info for all comments
    await post.populate({
      path: "comments.author",
      select: "displayName email profilePicture",
    });

    return res.status(201).json({ success: true, comments: post.comments });
  } catch (err) {
    console.error("Error adding comment:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
