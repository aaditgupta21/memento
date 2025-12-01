"use strict";

const express = require("express");
const router = express.Router();
const Album = require("../models/Album");
const User = require("../models/User");
const { generateLocationAlbumsForUser } = require("../utils/locationAlbumGenerator");

function parseLevels(levelsParam) {
  if (!levelsParam) return null;
  return String(levelsParam)
    .split(",")
    .map((lvl) => lvl.trim())
    .filter(Boolean);
}

// Refresh albums for the authenticated user
router.post("/refresh", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const minPhotos = Math.max(Number.parseInt(req.body?.minPhotos, 10) || 10, 10);
  const levels = parseLevels(req.body?.levels);

  try {
    const result = await generateLocationAlbumsForUser(req.user._id, {
      minPhotos,
      levels,
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("[LocationAlbums] Refresh failed:", error);
    if (error.message?.includes("BIGDATACLOUD_API_KEY")) {
      return res.status(503).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || "Server error" });
  }
});

// Get albums for a username (public/read-only)
router.get("/users/username/:username/location-albums", async (req, res) => {
  const { username } = req.params;
  const { refresh } = req.query;
  const minPhotos = Math.max(Number.parseInt(req.query?.minPhotos, 10) || 10, 10);
  const levels = parseLevels(req.query?.levels);

  try {
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optional refresh if requested
    if (refresh === "true") {
      try {
        await generateLocationAlbumsForUser(user._id, { minPhotos, levels });
      } catch (err) {
        console.warn("[LocationAlbums] Refresh skipped:", err.message);
        if (err.message?.includes("BIGDATACLOUD_API_KEY")) {
          return res.status(503).json({ error: err.message });
        }
      }
    }

    let albums = await Album.find({ owner: user._id })
      .sort({ photoCount: -1 })
      .lean();

    if (!albums.length && refresh !== "false") {
      try {
        await generateLocationAlbumsForUser(user._id, { minPhotos, levels });
        albums = await Album.find({ owner: user._id })
          .sort({ photoCount: -1 })
          .lean();
      } catch (err) {
        console.warn("[LocationAlbums] Auto-refresh skipped:", err.message);
        if (err.message?.includes("BIGDATACLOUD_API_KEY")) {
          return res.status(503).json({ error: err.message });
        }
      }
    }

    return res.json({
      success: true,
      summary: {
        albums: albums.length,
      },
      albums,
    });
  } catch (error) {
    console.error("[LocationAlbums] Fetch failed:", error);
    return res.status(500).json({ error: error.message || "Server error" });
  }
});

module.exports = router;
