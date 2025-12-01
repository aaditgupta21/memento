const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const { RESERVED_USERNAMES } = require("../constants");

// Session check helper
router.get("/me", (req, res) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        googleId: req.user.googleId || null,
        profilePicture: req.user.profilePicture || null,
        firstName: req.user.firstName || null,
        lastName: req.user.lastName || null,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Update username endpoint
router.post("/update-username", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(displayName.toLowerCase())) {
      return res.status(400).json({ error: "This username is reserved" });
    }

    // Find user and update displayName
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.displayName = displayName;
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    console.error("Update username error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Update name endpoint (firstName and lastName)
router.post("/update-name", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { firstName, lastName } = req.body;

    // Find user and update firstName and lastName
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.firstName = firstName?.trim() || "";
    user.lastName = lastName?.trim() || "";
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error("Update name error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Update profile picture endpoint
router.post("/update-profile-picture", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { profilePicture } = req.body;

    if (!profilePicture || !profilePicture.trim()) {
      return res.status(400).json({ error: "Profile picture URL is required" });
    }

    // Find user and update profilePicture
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.profilePicture = profilePicture.trim();
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Update profile picture error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Update password endpoint
router.post("/update-password", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Don't allow password changes for Google OAuth users
  if (req.user.googleId) {
    return res.status(400).json({
      error: "Password changes are not available for Google accounts",
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Update password (the pre-save hook will hash it)
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user object from userID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Return all fields EXCEPT password
    const user = await User.findById(userId).select(
      "displayName profilePicture"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get user object from username (displayName)
router.get("/username/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ displayName: username }).select(
      "displayName profilePicture _id firstName lastName"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error fetching user by username:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get all usernames with profile photos
router.get("/usernames", async (req, res) => {
  try {
    const users = await User.find({}, "displayName profilePicture").sort({
      displayName: 1,
    });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Error fetching usernames:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get all posts for a specific user by userId
router.get("/:userId/posts", async (req, res) => {
  console.log("Received request for user posts:", req.params.userId);
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const posts = await Post.find({ author: userId })
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
    console.error("Error fetching user posts:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get posts by username (displayName)
router.get("/username/:username/posts", async (req, res) => {
  const { username } = req.params;

  try {
    // First find the user by username
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ author: user._id })
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
    console.error("Error fetching user posts by username:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Get scrapbooks by username
router.get("/username/:username/scrapbooks", async (req, res) => {
  try {
    const { username } = req.params;
    const Scrapbook = require("../models/Scrapbook");

    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scrapbooks = await Scrapbook.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate("author", "displayName email")
      .populate("posts");

    res.json({
      success: true,
      scrapbooks,
    });
  } catch (err) {
    console.error("Error fetching user scrapbooks:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
