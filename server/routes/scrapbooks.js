const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Scrapbook = require("../models/Scrapbook");

// Create a scrapbook
router.post("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { title, description, coverImage, postIds } = req.body;

    console.log("Received scrapbook creation request:", {
      title,
      description,
      coverImage,
      postIds,
    });

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ error: "Description is required" });
    }

    if (!coverImage || !coverImage.trim()) {
      return res.status(400).json({ error: "Cover image is required" });
    }

    // Validate that all postIds exist and belong to the user
    let validPostIds = [];
    if (Array.isArray(postIds) && postIds.length > 0) {
      const posts = await Post.find({
        _id: { $in: postIds },
        author: req.user._id,
      });
      validPostIds = posts.map((post) => post._id);
    }

    // Create scrapbook in database
    const scrapbook = await Scrapbook.create({
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage.trim(),
      author: req.user._id,
      posts: validPostIds,
    });

    // Populate author and posts info
    await scrapbook.populate("author", "displayName email");
    await scrapbook.populate("posts");

    res.status(201).json({
      success: true,
      scrapbook,
    });
  } catch (err) {
    console.error("Error creating scrapbook:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get user's scrapbooks
router.get("/", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const scrapbooks = await Scrapbook.find({ author: req.user._id })
      .sort({ createdAt: -1 })
      .populate("author", "displayName email")
      .populate("posts");

    res.json({
      success: true,
      scrapbooks,
    });
  } catch (err) {
    console.error("Error fetching scrapbooks:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Get a specific scrapbook by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const scrapbook = await Scrapbook.findById(id)
      .populate("author", "displayName email")
      .populate("posts");

    if (!scrapbook) {
      return res.status(404).json({ error: "Scrapbook not found" });
    }

    res.json({
      success: true,
      scrapbook,
    });
  } catch (err) {
    console.error("Error fetching scrapbook:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Delete a scrapbook
router.delete("/:id", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { id } = req.params;

    const scrapbook = await Scrapbook.findById(id);
    if (!scrapbook) {
      return res.status(404).json({ error: "Scrapbook not found" });
    }

    // Check if user owns the scrapbook
    if (scrapbook.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this scrapbook" });
    }

    await Scrapbook.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Scrapbook deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting scrapbook:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
