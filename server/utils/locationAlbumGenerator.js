"use strict";

/**
 * Location album generator.
 * Reuses EXIF + reverse geocode clustering to upsert albums per user.
 */

const Album = require("../models/Album");
const { mapEntriesWithReverseGeocode } = require("../geospatial/boundaryCluster");

function formatDateRange(dates) {
  if (!dates.length) return "Unknown";
  const opts = { year: "numeric", month: "short", day: "numeric" };
  const first = dates[0].toLocaleDateString("en-US", opts);
  if (dates.length === 1) return first;
  const last = dates[dates.length - 1].toLocaleDateString("en-US", opts);
  return `${first} - ${last}`;
}

function buildAlbumsFromClusters(clustersByLevel, { minPhotos }) {
  const albums = [];

  for (const [, boundaryMap] of clustersByLevel.entries()) {
    for (const [, cluster] of boundaryMap.entries()) {
      if (!cluster.entries || cluster.entries.length < minPhotos) continue;

      const timestamps = cluster.entries
        .map((entry) => {
          const raw =
            entry.capturedAt ||
            entry.timestamp ||
            entry.postCreatedAt ||
            entry.metadata?.DateTimeOriginal ||
            entry.metadata?.CreateDate;
          const date = raw instanceof Date ? raw : new Date(raw);
          return Number.isNaN(date.getTime()) ? null : date;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);

      const cover = cluster.entries[0] || {};

      albums.push({
        boundaryId: cluster.boundaryId,
        level: cluster.level,
        title: cluster.name || "Unknown Location",
        summary: cluster.description || null,
        coverImage: cover.imageUrl || cover.imagePath || "",
        photos: cluster.entries.map((entry) => ({
          url: entry.imageUrl || entry.imagePath || "",
          postId: entry.postId,
          caption: entry.postCaption || "",
          location: entry.postLocation || cluster.name || "",
          latitude: entry.gps?.latitude ?? null,
          longitude: entry.gps?.longitude ?? null,
          timestamp:
            entry.capturedAt ||
            entry.timestamp ||
            entry.postCreatedAt ||
            null,
        })),
        photoCount: cluster.entries.length,
        dateRange: formatDateRange(timestamps),
      });
    }
  }

  // Sort by photo count descending
  albums.sort((a, b) => b.photoCount - a.photoCount);
  return albums;
}

function computeLevelRank(level) {
  const n = Number.parseInt(level, 10);
  if (!Number.isNaN(n)) return n;
  return 999; // unknowns rank lowest priority (kept only if no finer level)
}

async function generateLocationAlbumsForUser(userId, options = {}) {
  if (!userId) {
    throw new Error("userId is required to generate location albums");
  }

  const { minPhotos = 10, levels = null } = options;
  const minPhotosNormalized = Math.max(minPhotos, 10);

  if (!process.env.BIGDATACLOUD_API_KEY) {
    throw new Error("BIGDATACLOUD_API_KEY is missing; cannot build location albums.");
  }

  // Lazy import to avoid circular dependency during Post model init
  const { loadScrapbookEntriesFromPosts } = require("../geospatial/EXIFReader");
  const entries = await loadScrapbookEntriesFromPosts({}, { userId });

  const withGps = entries.filter(
    (e) =>
      e.gps &&
      typeof e.gps.latitude === "number" &&
      typeof e.gps.longitude === "number",
  );

  const { clustersByLevel, withoutLocation } =
    await mapEntriesWithReverseGeocode(withGps);

  const filteredClusters = levels ? new Map() : clustersByLevel;
  if (levels) {
    for (const [level, map] of clustersByLevel.entries()) {
      if (levels.includes(level)) {
        filteredClusters.set(level, map);
      }
    }
  }

  const albums = buildAlbumsFromClusters(
    filteredClusters.size ? filteredClusters : clustersByLevel,
    { minPhotos: minPhotosNormalized },
  );

  // Deduplicate albums by identical photo sets, keep lowest-level (finer) boundary
  const deduped = new Map();
  for (const album of albums) {
    const signature = (album.photos || [])
      .map((p) => p.url)
      .filter(Boolean)
      .sort()
      .join("|");
    if (!signature) continue;
    const existing = deduped.get(signature);
    if (!existing) {
      deduped.set(signature, album);
      continue;
    }
    const currentRank = computeLevelRank(album.level);
    const existingRank = computeLevelRank(existing.level);
    if (currentRank < existingRank) {
      deduped.set(signature, album);
    }
  }

  const finalAlbums = Array.from(deduped.values()).filter(
    (a) => (a.photoCount || a.photos?.length || 0) >= minPhotosNormalized,
  );

  // Clear existing albums for this user to avoid stale data
  await Album.deleteMany({ owner: userId });

  // Upsert albums
  for (const album of finalAlbums) {
    await Album.findOneAndUpdate(
      { owner: userId, boundaryId: album.boundaryId },
      {
        title: album.title,
        owner: userId,
        level: album.level,
        boundaryId: album.boundaryId,
        coverImage: album.coverImage,
        photos: album.photos,
        photoCount: album.photoCount,
        dateRange: album.dateRange,
        summary: album.summary,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // Optional: clean up old albums not in current set
  return {
    albums: finalAlbums,
    summary: {
      totalPhotos: entries.length,
      photosWithGps: withGps.length,
      photosWithoutGps: withoutLocation.length,
      albums: finalAlbums.length,
    },
  };
}

module.exports = {
  generateLocationAlbumsForUser,
};
