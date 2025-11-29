const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const mongoose = require("mongoose");
const exifr = require("exifr");
const {
  mapEntriesWithReverseGeocode,
} = require("./boundaryCluster");

const DEFAULT_IMAGE_EXTENSIONS = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".heic",
]);


const DEFAULT_IMAGE_DIR =
  process.env.SCRAPBOOK_IMAGE_DIR ||
  path.join(process.cwd(), "photos"); // Keep photos outside repo by default.
const DEFAULT_DB_COLLECTION =
  process.env.SCRAPBOOK_COLLECTION || "photos"; // Future Atlas collection name.

function isImageFile(filePath) {
  return DEFAULT_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

async function readDirectoryRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await readDirectoryRecursive(entryPath)));
    } else if (entry.isFile() && isImageFile(entryPath)) {
      files.push(entryPath);
    }
  }

  return files;
}

async function extractExifMetadata(imageInput, { label } = {}) {
  try {
    return await exifr.parse(imageInput, {
      exif: true,
      ifd0: true,
      gps: true,
      xmp: true,
      icc: true,
      tiff: true,
    });
  } catch (error) {
    const targetLabel =
      label ||
      (Buffer.isBuffer(imageInput) ? "[buffer]" : `${imageInput}`);
    console.warn(
      `Failed to parse EXIF data for ${targetLabel}: ${error.message}`,
    );
    return null;
  }
}

async function loadScrapbookEntries(imageDir = DEFAULT_IMAGE_DIR) {
  if (!existsSync(imageDir)) {
    throw new Error(
      `Image directory "${imageDir}" does not exist. Set SCRAPBOOK_IMAGE_DIR or pass a path.`,
    );
  }

  const imagePaths = await readDirectoryRecursive(imageDir);

  const entries = [];
  for (const imagePath of imagePaths) {
    const metadata = await extractExifMetadata(imagePath);
    entries.push({
      imagePath,
      metadata,
      capturedAt: metadata?.DateTimeOriginal || metadata?.CreateDate || null,
      cameraModel: metadata?.Model || null,
      gps: metadata?.gps || null,
    });
  }

  return entries;
}

async function fetchImagesFromDb(collectionName = DEFAULT_DB_COLLECTION) {
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Provide it before using Atlas ingestion.",
      );
    }
    await mongoose.connect(uri);
  }

  const cursor = mongoose.connection.db
    .collection(collectionName)
    .find({}, { projection: { data: 1, filename: 1 } });

  const images = [];
  for await (const doc of cursor) {
    if (!doc?.data) continue;
    let buffer;
    if (Buffer.isBuffer(doc.data)) {
      buffer = doc.data;
    } else if (doc.data?.buffer) {
      buffer = Buffer.from(doc.data.buffer);
    } else if (Array.isArray(doc.data)) {
      buffer = Buffer.from(doc.data);
    } else {
      continue;
    }
    images.push({
      filename: doc.filename || `photo-${doc._id}`,
      buffer,
    });
  }

  return images;
}

async function loadScrapbookEntriesFromDb(collectionName) {
  const imageDocs = await fetchImagesFromDb(collectionName);
  const entries = [];

  for (const doc of imageDocs) {
    const metadata = await extractExifMetadata(doc.buffer, {
      label: doc.filename,
    });
    entries.push({
      source: "mongodb",
      filename: doc.filename,
      metadata,
      capturedAt: metadata?.DateTimeOriginal || metadata?.CreateDate || null,
      cameraModel: metadata?.Model || null,
      gps: metadata?.gps || null,
    });
  }

  return entries;
}


async function main() {
  const [, , dirArg, collectionArg] = process.argv;
  const useDb = dirArg === "--atlas";
  const targetDir =
    !useDb && dirArg ? path.resolve(dirArg) : DEFAULT_IMAGE_DIR;
  const collectionName = collectionArg || DEFAULT_DB_COLLECTION;

  try {
    const scrapbookEntries = useDb
      ? await loadScrapbookEntriesFromDb(collectionName)
      : await loadScrapbookEntries(targetDir);
    let enrichedEntries = scrapbookEntries;
    console.log(
      `Loaded ${scrapbookEntries.length} images from ${
        useDb ? `MongoDB Atlas (${collectionName})` : targetDir
      }`,
    );
    if (process.env.BIGDATACLOUD_API_KEY) {
      const { annotatedEntries, clustersByLevel, withoutLocation } =
        await mapEntriesWithReverseGeocode(scrapbookEntries);
      enrichedEntries = annotatedEntries;
      console.log(
        `[Geospatial] Reverse-geocoded ${annotatedEntries.length} entries across ${clustersByLevel.size} boundary level(s).`,
      );
      if (withoutLocation.length) {
        console.log(
          `[Geospatial] ${withoutLocation.length} entries missing GPS metadata.`,
        );
      }
      for (const [level, clusterMap] of clustersByLevel.entries()) {
        const entryCount = Array.from(clusterMap.values()).reduce(
          (sum, cluster) => sum + cluster.entries.length,
          0,
        );
        console.log(
          `  - ${level}: ${clusterMap.size} boundary clusters covering ${entryCount} photo(s).`,
        );
      }
    }
    if (enrichedEntries.length) {
      console.dir(enrichedEntries[0], { depth: null });
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

/**
 * Download image from URL and return as Buffer
 * @param {string} url - Image URL (uploadthing or any HTTP(S) URL)
 * @returns {Promise<Buffer>} Image data as Buffer
 */
async function downloadImageFromUrl(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get response as ArrayBuffer then convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Failed to download image from ${url}: ${error.message}`);
  }
}

/**
 * Load scrapbook entries from Post collection
 * Downloads images from uploadthing URLs and extracts EXIF
 * @param {Object} query - MongoDB query filter (default: all posts)
 * @param {Object} options - Options
 * @param {number} options.limit - Limit number of posts to process
 * @param {string} options.userId - Filter posts by user ID
 * @returns {Promise<Array>} Scrapbook entries with GPS data
 */
async function loadScrapbookEntriesFromPosts(query = {}, options = {}) {
  const { limit = null, userId = null } = options;

  // Ensure MongoDB connection
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Provide it before using Post ingestion."
      );
    }
    await mongoose.connect(uri);
  }

  // Import Post model
  const Post = require("../models/Post");

  // Apply user filter if provided
  if (userId) {
    query = { ...query, author: userId };

    // Optional: Look up user display name
    try {
      const User = require("../models/User");
      const user = await User.findById(userId).select('username email').exec();
      if (user) {
        console.log(`[Posts] Filtering for user: ${user.username || user.email} (${userId})`);
      } else {
        console.log(`[Posts] Filtering for user: ${userId}`);
        console.warn(`[Posts] Warning: User ${userId} not found in database`);
      }
    } catch (error) {
      console.log(`[Posts] Filtering for user: ${userId}`);
    }
  } else {
    console.log(`[Posts] Loading posts from all users`);
  }

  // Query posts
  let queryBuilder = Post.find(query).sort({ createdAt: -1 });
  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  const posts = await queryBuilder.exec();
  console.log(`[Posts] Found ${posts.length} posts to process`);

  const entries = [];
  let processedImages = 0;
  let skippedImages = 0;

  // Process each post
  for (const post of posts) {
    // Process each image in the post
    for (const image of post.images || []) {
      processedImages++;

      try {
        console.log(
          `[${processedImages}/${posts.reduce((sum, p) => sum + p.images.length, 0)}] Downloading: ${image.url}`
        );

        // Download image from URL
        const buffer = await downloadImageFromUrl(image.url);

        // Extract EXIF metadata
        const metadata = await extractExifMetadata(buffer, {
          label: image.url,
        });

        if (!metadata) {
          console.warn(`  ⚠️  No EXIF data found`);
          skippedImages++;
          continue;
        }

        // Check for GPS data
        if (!metadata.latitude || !metadata.longitude) {
          console.warn(`  ⚠️  No GPS data in EXIF`);
          skippedImages++;
          continue;
        }

        console.log(
          `  ✓ GPS found: ${metadata.latitude.toFixed(4)}, ${metadata.longitude.toFixed(4)}`
        );

        // Create entry
        entries.push({
          source: "posts",
          postId: post._id,
          imageUrl: image.url,
          imageOrder: image.order,
          metadata,
          capturedAt:
            metadata.DateTimeOriginal || metadata.CreateDate || post.createdAt,
          cameraModel: metadata.Model || null,
          gps: {
            latitude: metadata.latitude,
            longitude: metadata.longitude,
          },
          // Include post metadata
          postCaption: post.caption,
          postLocation: post.location,
          postCategories: post.categories,
          postAuthor: post.author,
          postCreatedAt: post.createdAt,
        });
      } catch (error) {
        console.error(`  ❌ Error processing ${image.url}: ${error.message}`);
        skippedImages++;
      }
    }
  }

  console.log(
    `\n[Posts] Processed ${processedImages} images: ${entries.length} with GPS, ${skippedImages} skipped`
  );

  return entries;
}

if (require.main === module) {
  main();
}


module.exports = {
  loadScrapbookEntries,
  loadScrapbookEntriesFromDb,
  fetchImagesFromDb,
  extractExifMetadata,
  downloadImageFromUrl,
  loadScrapbookEntriesFromPosts,
};
