"use strict";

/**
 * Migration script to extract and store EXIF data for existing posts
 * Run with: node server/scripts/migrateExifData.js [options]
 *
 * Options:
 *   --dry-run          Show what would be updated without making changes
 *   --batch-size=N     Process N posts at a time (default: 10)
 *   --user-id=ID       Only migrate posts for specific user
 *   --limit=N          Only process first N posts (for testing)
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const { extractExifFromUrl } = require("../geospatial/EXIFReader");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes("--dry-run"),
  batchSize:
    parseInt(args.find((a) => a.startsWith("--batch-size="))?.split("=")[1]) ||
    10,
  userId: args.find((a) => a.startsWith("--user-id="))?.split("=")[1] || null,
  limit:
    parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1]) ||
    null,
};

async function migrateExifData() {
  console.log("=".repeat(60));
  console.log("EXIF Data Migration Script");
  console.log("=".repeat(60));
  console.log(
    `Dry run: ${options.dryRun ? "YES (no changes)" : "NO (will update)"}`
  );
  console.log(`Batch size: ${options.batchSize}`);
  if (options.userId) console.log(`User filter: ${options.userId}`);
  if (options.limit) console.log(`Limit: ${options.limit} posts`);
  console.log("");

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
    process.exit(1);
  }

  // Build query
  const query = options.userId ? { author: options.userId } : {};

  // Find posts that need migration (images without EXIF data)
  let queryBuilder = Post.find({
    ...query,
    images: {
      $elemMatch: {
        "exif.latitude": { $exists: false }, // Images missing EXIF data
      },
    },
  }).select("images author");

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  const posts = await queryBuilder.exec();
  console.log(`Found ${posts.length} posts needing EXIF migration\n`);

  if (posts.length === 0) {
    console.log("No posts to migrate. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Statistics
  let stats = {
    postsProcessed: 0,
    imagesProcessed: 0,
    imagesWithGPS: 0,
    imagesWithoutGPS: 0,
    errors: 0,
  };

  // Process posts in batches
  for (let i = 0; i < posts.length; i += options.batchSize) {
    const batch = posts.slice(i, i + options.batchSize);
    console.log(
      `Processing batch ${Math.floor(i / options.batchSize) + 1}/${Math.ceil(
        posts.length / options.batchSize
      )} (${batch.length} posts)...`
    );

    for (const post of batch) {
      stats.postsProcessed++;
      let postUpdated = false;

      // Process each image in the post
      for (let imgIndex = 0; imgIndex < post.images.length; imgIndex++) {
        const image = post.images[imgIndex];
        stats.imagesProcessed++;

        // Skip if EXIF already exists
        if (image.exif?.latitude != null) {
          console.log(
            `  [${imgIndex + 1}/${post.images.length}] Already has EXIF - skipping`
          );
          continue;
        }

        try {
          console.log(
            `  [${imgIndex + 1}/${post.images.length}] Extracting EXIF from ${image.url}...`
          );

          // Extract EXIF data
          const exifData = await extractExifFromUrl(image.url);

          if (exifData && exifData.latitude != null && exifData.longitude != null) {
            stats.imagesWithGPS++;
            console.log(
              `    ✓ GPS found: ${exifData.latitude.toFixed(
                4
              )}, ${exifData.longitude.toFixed(4)}`
            );

            // Update image with EXIF data
            if (!options.dryRun) {
              post.images[imgIndex].exif = exifData;
              postUpdated = true;
            }
          } else {
            stats.imagesWithoutGPS++;
            console.log(`    ⚠ No GPS data found`);

            // Store empty EXIF object to mark as processed
            if (!options.dryRun) {
              post.images[imgIndex].exif = {
                latitude: null,
                longitude: null,
                timestamp: exifData?.timestamp || null,
                cameraModel: exifData?.cameraModel || null,
              };
              postUpdated = true;
            }
          }
        } catch (error) {
          stats.errors++;
          console.error(`    ✗ Error: ${error.message}`);
        }

        // Small delay to avoid overwhelming UploadThing
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Save post if updated
      if (postUpdated && !options.dryRun) {
        await post.save();
        console.log(`  ✓ Post ${post._id} updated`);
      }
    }

    console.log("");
  }

  // Print summary
  console.log("=".repeat(60));
  console.log("Migration Summary");
  console.log("=".repeat(60));
  console.log(`Posts processed:       ${stats.postsProcessed}`);
  console.log(`Images processed:      ${stats.imagesProcessed}`);
  console.log(`Images with GPS:       ${stats.imagesWithGPS}`);
  console.log(`Images without GPS:    ${stats.imagesWithoutGPS}`);
  console.log(`Errors:                ${stats.errors}`);
  console.log("");

  if (options.dryRun) {
    console.log("DRY RUN - No changes were made to the database");
  } else {
    console.log("✓ Migration completed successfully");
  }

  // Disconnect
  await mongoose.disconnect();
  console.log("✓ Disconnected from MongoDB");
}

// Run migration
if (require.main === module) {
  migrateExifData().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
}

module.exports = { migrateExifData };
