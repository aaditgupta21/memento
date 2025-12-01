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
    const { images, caption, location, categories, geolocation } = req.body;

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
      geolocation,
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
    const { author } = req.query;

    // Build query - filter by author if provided
    const query = author ? { author } : {};

    const posts = await Post.find(query)
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

// Get photo locations with EXIF data
router.get("/photo-locations", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required"
      });
    }

    // Use existing EXIF reader with user filter
    const { loadScrapbookEntriesFromPosts } = require('../geospatial/EXIFReader');

    const entries = await loadScrapbookEntriesFromPosts(
      { author: userId },
      { limit: null }
    );

    // Transform to map-friendly format
    const photoLocations = entries
      .filter(entry => entry.gps?.latitude && entry.gps?.longitude)
      .map(entry => ({
        type: 'photo',
        coordinates: [entry.gps.longitude, entry.gps.latitude],
        imageUrl: entry.imageUrl,
        postId: entry.postId,
        timestamp: entry.capturedAt,
        location: entry.postLocation || 'Unknown Location'
      }));

    res.json({ success: true, photoLocations });
  } catch (error) {
    console.error('Error extracting photo locations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Location search endpoint
router.get("/locations/search", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res
        .status(400)
        .json({ error: "Query must be at least 2 characters" });
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=5&addressdetails=1`;

    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Memento-App/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from Nominatim");
    }

    const data = await response.json();

    const locations = data.map((item) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      name: item.name || item.display_name.split(",")[0],
      lat: item.lat,
      lon: item.lon,
      type: item.type,
      address: {
        city:
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.hamlet ||
          null,
        state: item.address?.state,
        country: item.address?.country,
      },
    }));

    res.json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({ error: "Failed to fetch location suggestions" });
  }
});

// delete a post
router.delete("/:postId", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { postId } = req.params;

  if (!mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user is the author of the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
