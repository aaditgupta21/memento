"use strict";

/**
 * Generate location-based scrapbook lists from photos
 *
 * This is a lean, filesystem-only tool that:
 * - Extracts GPS data from photo EXIF
 * - Clusters photos by geographic boundaries
 * - Outputs JSON lists of photos grouped by location (≥10 photos per location)
 * - Does NOT write to database - user reviews output and creates scrapbooks manually
 *
 * Usage:
 *   node server/generateScrapbookLists.js /path/to/photos
 *   node server/generateScrapbookLists.js /path/to/photos --min-photos=15
 *   node server/generateScrapbookLists.js /path/to/photos --output=lists.json
 *
 * Environment:
 *   BIGDATACLOUD_API_KEY - Required for reverse geocoding
 */

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const fs = require("fs/promises");

// Use existing infrastructure
const {
  loadScrapbookEntries,           // Filesystem mode
  loadScrapbookEntriesFromDb,     // MongoDB mode (raw binary data)
  loadScrapbookEntriesFromPosts   // Posts mode (uploadthing URLs)
} = require("./geospatial/EXIFReader");
const { mapEntriesWithReverseGeocode } = require("./geospatial/boundaryCluster");


/**
 * Main function to generate scrapbook lists
 * @param {Object} source - Photo source configuration
 * @param {string} source.type - Source type: 'filesystem' or 'mongodb'
 * @param {string} [source.path] - Directory path (for filesystem mode)
 * @param {string} [source.collection] - MongoDB collection name (for mongodb mode)
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Generated scrapbook lists with metadata
 */
async function generateScrapbookLists(source, options = {}) {
  const {
    minPhotos = 10,
    levels = null,
    outputFile = null,
  } = options;

  console.log("\n=== SCRAPBOOK LIST GENERATOR ===");

  // Display source information
  if (source.type === 'posts') {
    console.log(`Source: Post collection (downloading from uploadthing URLs)`);
    if (source.limit) {
      console.log(`Limit: ${source.limit} posts`);
    }
  } else if (source.type === 'mongodb') {
    console.log(`Source: MongoDB collection "${source.collection}"`);
  } else {
    console.log(`Source: Filesystem directory "${source.path}"`);
  }

  console.log(`Minimum photos per location: ${minPhotos}`);
  if (levels) {
    console.log(`Filtering levels: ${levels.join(", ")}`);
  }

  // Validate MongoDB connection if needed
  if (source.type === 'mongodb') {
    const mongoose = require('mongoose');

    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI environment variable is required for MongoDB mode.\n" +
        "Add to your .env file:\n" +
        "MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database"
      );
    }

    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      console.log("      Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("      ✓ Connected to MongoDB");
    }
  }

  // Validate API key
  if (!process.env.BIGDATACLOUD_API_KEY) {
    throw new Error(
      "BIGDATACLOUD_API_KEY environment variable is required.\n" +
      "Get a free API key at: https://www.bigdatacloud.com/\n" +
      "Then set it: export BIGDATACLOUD_API_KEY=your_key_here"
    );
  }

  // Step 1: Load photos and extract EXIF GPS data
  console.log("\n[1/4] Loading photos and extracting EXIF data...");

  let entries;
  if (source.type === 'posts') {
    console.log(`      Querying Post collection and downloading images...`);
    entries = await loadScrapbookEntriesFromPosts(source.query, {
      limit: source.limit
    });
  } else if (source.type === 'mongodb') {
    console.log(`      Loading from MongoDB collection: ${source.collection}`);
    entries = await loadScrapbookEntriesFromDb(source.collection);
  } else {
    console.log(`      Scanning directory: ${source.path}`);
    entries = await loadScrapbookEntries(source.path);
  }

  const withGPS = entries.filter(e => e.gps?.latitude && e.gps?.longitude);
  const withoutGPS = entries.filter(e => !e.gps?.latitude || !e.gps?.longitude);

  console.log(`      Found ${entries.length} total photos`);
  console.log(`      ${withGPS.length} with GPS data`);
  console.log(`      ${withoutGPS.length} without GPS data`);

  if (withGPS.length === 0) {
    console.log("\n⚠️  No photos with GPS data found. Cannot generate location-based lists.");
    return {
      generated: new Date().toISOString(),
      config: { minPhotos, levels },
      summary: {
        totalPhotos: entries.length,
        photosWithGPS: 0,
        photosWithoutGPS: withoutGPS.length,
        locationsFound: 0,
        totalPhotosInLists: 0,
      },
      scrapbookLists: [],
      photosWithoutLocation: withoutGPS.map(e => e.imagePath),
    };
  }

  // Step 2: Reverse geocode and cluster by boundaries
  console.log("\n[2/4] Clustering photos by geographic boundaries...");
  console.log("      (This may take a while for many photos)");

  const { annotatedEntries, clustersByLevel, withoutLocation } =
    await mapEntriesWithReverseGeocode(withGPS);

  console.log(`      Clustered across ${clustersByLevel.size} boundary level(s)`);

  // Log cluster counts per level
  for (const [level, clusterMap] of clustersByLevel.entries()) {
    const photoCount = Array.from(clusterMap.values()).reduce(
      (sum, cluster) => sum + cluster.entries.length,
      0
    );
    console.log(`      - ${level}: ${clusterMap.size} locations, ${photoCount} photos`);
  }

  // Step 3: Filter and format scrapbook lists
  console.log("\n[3/4] Building scrapbook lists (minimum " + minPhotos + " photos)...");

  const scrapbookLists = buildScrapbookLists(clustersByLevel, { minPhotos, levels });

  console.log(`      Generated ${scrapbookLists.length} scrapbook list(s)`);

  // Step 4: Prepare output
  const output = {
    generated: new Date().toISOString(),
    config: { minPhotos, levels },
    summary: {
      totalPhotos: entries.length,
      photosWithGPS: withGPS.length,
      photosWithoutGPS: withoutGPS.length + withoutLocation.length,
      locationsFound: scrapbookLists.length,
      totalPhotosInLists: scrapbookLists.reduce((sum, list) => sum + list.photos.length, 0),
    },
    scrapbookLists,
    photosWithoutLocation: [
      ...withoutGPS.map(e => e.imagePath),
      ...withoutLocation.map(e => e.imagePath || e.filename),
    ],
  };

  // Step 5: Display and save results
  console.log("\n[4/4] Results:");

  if (scrapbookLists.length === 0) {
    console.log("\n⚠️  No locations found with ≥" + minPhotos + " photos.");
    console.log("   Try lowering --min-photos threshold.");
  } else {
    console.log("\n=== SCRAPBOOK LISTS ===\n");

    // Display table
    console.table(
      scrapbookLists.map(list => ({
        Location: list.name,
        Level: list.level,
        Photos: list.photoCount,
        "Date Range": list.dateRange,
      }))
    );

    // Save to file if specified
    if (outputFile) {
      await fs.writeFile(outputFile, JSON.stringify(output, null, 2), "utf-8");
      console.log(`\n✅ Saved to: ${outputFile}`);
    } else {
      console.log("\n💡 Use --output=filename.json to save results to file");
    }
  }

  return output;
}

/**
 * Build formatted scrapbook lists from clusters
 * Core logic: Filter by minPhotos and format output
 * @param {Map<string, Map<string, Object>>} clustersByLevel - Clusters from boundaryCluster
 * @param {Object} options - Filter options
 * @returns {Array<Object>} Formatted scrapbook lists
 */
function buildScrapbookLists(clustersByLevel, options) {
  const { minPhotos, levels } = options;
  const lists = [];

  for (const [level, boundaryMap] of clustersByLevel.entries()) {
    // Skip if level not in filter
    if (levels && !levels.includes(level)) {
      continue;
    }

    for (const [boundaryId, cluster] of boundaryMap.entries()) {
      // CRITICAL FILTER: Only include clusters with ≥ minPhotos
      if (!cluster.entries || cluster.entries.length < minPhotos) {
        continue;
      }

      // Extract timestamps for date range calculation
      const timestamps = cluster.entries
        .map(e => {
          const ts = e.capturedAt || e.timestamp || e.metadata?.DateTimeOriginal;
          if (!ts) return null;
          const date = ts instanceof Date ? ts : new Date(ts);
          return isNaN(date.getTime()) ? null : date;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);

      const dateRange = timestamps.length > 0
        ? timestamps.length === 1
          ? formatDate(timestamps[0])
          : `${formatDate(timestamps[0])} - ${formatDate(timestamps[timestamps.length - 1])}`
        : "Unknown";

      // Build scrapbook list entry
      lists.push({
        boundaryId: cluster.boundaryId,
        level: cluster.level,
        name: cluster.name || "Unknown Location",
        code: cluster.code || null,
        photoCount: cluster.entries.length,
        dateRange,
        suggestedTitle: `${cluster.name || "Unknown"} Memories (${cluster.entries.length} photo${cluster.entries.length === 1 ? "" : "s"})`,
        suggestedDescription: `Photos from ${cluster.name || "Unknown Location"}${timestamps.length > 0 ? `, captured ${timestamps.length === 1 ? "on" : "between"} ${dateRange}` : ""}.`,
        coverPhoto: cluster.entries[0].imagePath || cluster.entries[0].filename,
        photos: cluster.entries.map(e => ({
          filePath: e.imagePath || e.filename,
          fileName: e.imagePath ? path.basename(e.imagePath) : e.filename,
          latitude: e.gps?.latitude || null,
          longitude: e.gps?.longitude || null,
          timestamp: e.capturedAt || e.timestamp || null,
          camera: e.cameraModel || e.metadata?.Model || null,
        })),
      });
    }
  }

  // Sort by photo count (descending) - most photos first
  lists.sort((a, b) => b.photoCount - a.photoCount);

  return lists;
}

/**
 * Format Date to readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Parse command-line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed source and options
 */
function parseArgs(args) {
  let source;
  let startIndex = 0;

  // Determine source type from first argument
  if (args[0] === '--posts' || args[0] === '--post') {
    // Posts mode - query Post collection and download from uploadthing URLs
    source = {
      type: 'posts',
      query: {},  // Default: all posts
      limit: null  // Default: no limit
    };

    startIndex = 1;
  } else if (args[0] === '--mongodb' || args[0] === '--mongo') {
    // MongoDB mode
    // Check if next arg is collection name (not a flag)
    const collection = args[1] && !args[1].startsWith('--')
      ? args[1]
      : process.env.SCRAPBOOK_COLLECTION || 'photos';

    source = {
      type: 'mongodb',
      collection
    };

    startIndex = args[1] && !args[1].startsWith('--') ? 2 : 1;
  } else if (args[0] && !args[0].startsWith('--')) {
    // Filesystem mode (directory path provided)
    source = {
      type: 'filesystem',
      path: args[0]
    };

    startIndex = 1;
  } else {
    // No source specified - try to auto-detect
    if (process.env.MONGODB_URI && process.env.SCRAPBOOK_COLLECTION) {
      // Auto-use MongoDB if configured
      source = {
        type: 'mongodb',
        collection: process.env.SCRAPBOOK_COLLECTION
      };
      startIndex = 0;
    } else {
      // Cannot determine source
      console.error('Error: No photo source specified');
      printUsage();
      process.exit(1);
    }
  }

  const options = {};

  // Parse flags starting from startIndex
  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--min-photos=")) {
      const value = parseInt(arg.split("=")[1], 10);
      if (isNaN(value) || value < 1) {
        console.error("Error: --min-photos must be a positive number");
        process.exit(1);
      }
      options.minPhotos = value;
    } else if (arg.startsWith("--levels=")) {
      const value = arg.split("=")[1];
      options.levels = value.split(",").map(s => s.trim()).filter(Boolean);
    } else if (arg.startsWith("--output=")) {
      options.outputFile = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      const value = parseInt(arg.split("=")[1], 10);
      if (isNaN(value) || value < 1) {
        console.error("Error: --limit must be a positive number");
        process.exit(1);
      }
      // Apply limit to source if it's posts mode
      if (source.type === 'posts') {
        source.limit = value;
      }
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      printUsage();
      process.exit(1);
    }
  }

  return { source, options };
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
Usage: node server/generateScrapbookLists.js <source> [options]

Sources:
  <directory-path>       Load photos from filesystem directory
  --posts                Load from Post collection (downloads from uploadthing URLs) **RECOMMENDED**
  --mongodb [collection] Load photos from MongoDB binary data (collection: "photos")
  --mongo [collection]   Alias for --mongodb

Arguments:
  directory-path         Path to directory containing photos

Options:
  --min-photos=N         Minimum photos per location to create list (default: 10)
  --levels=a,b,c         Comma-separated boundary levels (e.g., city,state)
  --output=file.json     Save output to JSON file
  --limit=N              Limit number of posts to process (posts mode only)
  --help, -h             Show this help message

Examples:
  # Posts mode (RECOMMENDED - works with your existing Post data)
  node server/generateScrapbookLists.js --posts
  node server/generateScrapbookLists.js --posts --output=scrapbooks.json
  node server/generateScrapbookLists.js --posts --limit=50 --min-photos=5

  # Filesystem mode
  node server/generateScrapbookLists.js ~/Photos
  node server/generateScrapbookLists.js ~/Photos --min-photos=15 --output=lists.json

  # MongoDB mode (raw binary data - not typical)
  node server/generateScrapbookLists.js --mongodb photos
  node server/generateScrapbookLists.js --mongo vacation_photos --min-photos=20

Environment Variables:
  MONGODB_URI              MongoDB connection string (required for all modes except filesystem)
  BIGDATACLOUD_API_KEY     Required for reverse geocoding

How It Works:
  Posts Mode:
    1. Queries Post collection from MongoDB
    2. For each post, downloads images from uploadthing URLs
    3. Extracts EXIF GPS data from downloaded images
    4. Clusters photos by geographic boundaries
    5. Generates scrapbook suggestions

  Post Schema (existing):
    {
      images: [{ url: String, order: Number }],  // Uploadthing URLs
      author: ObjectId,
      location: String,
      categories: [String],
      createdAt: Date
    }

Output:
  JSON file containing:
  - Summary statistics
  - List of scrapbook suggestions (locations with ≥N photos)
  - Photo file paths (or filenames for MongoDB), GPS coordinates, timestamps
  - List of photos without GPS data
`);
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Check for help flag first
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const { source, options } = parseArgs(args);

  generateScrapbookLists(source, options)
    .then(() => {
      console.log("\n✅ Done!\n");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n❌ Error:", error.message);
      if (error.stack && process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    });
}

/**
 * Exported for programmatic use
 * @example
 * // Filesystem mode
 * await generateScrapbookLists(
 *   { type: 'filesystem', path: '/photos' },
 *   { minPhotos: 10, outputFile: 'lists.json' }
 * );
 *
 * // MongoDB mode
 * await generateScrapbookLists(
 *   { type: 'mongodb', collection: 'photos' },
 *   { minPhotos: 10, outputFile: 'lists.json' }
 * );
 */
module.exports = { generateScrapbookLists, buildScrapbookLists };
