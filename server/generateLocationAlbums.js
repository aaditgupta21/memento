"use strict";

/**
 * CLI: Generate location albums for a user (or all users).
 *
 * Usage:
 *   node server/generateLocationAlbums.js <userId>
 *   node server/generateLocationAlbums.js --all
 *   node server/generateLocationAlbums.js --levels=6,4 --minPhotos=12
 */

const mongoose = require("mongoose");
const path = require("path");
const { generateLocationAlbumsForUser } = require("./utils/locationAlbumGenerator");
const User = require("./models/User");

require("dotenv").config({ path: path.join(__dirname, ".env") });

function parseArgs(argv) {
  const args = { all: false, userId: null, minPhotos: 10, levels: null };
  for (const arg of argv) {
    if (arg === "--all") args.all = true;
    else if (arg.startsWith("--levels=")) {
      args.levels = arg
        .split("=")[1]
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--minPhotos=")) {
      const val = Number.parseInt(arg.split("=")[1], 10);
      if (!Number.isNaN(val) && val > 0) args.minPhotos = val;
    } else if (!arg.startsWith("--")) {
      args.userId = arg;
    }
  }
  return args;
}

async function main() {
  const [, , ...argv] = process.argv;
  const args = parseArgs(argv);

  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is required.");
    process.exit(1);
  }
  if (!process.env.BIGDATACLOUD_API_KEY) {
    console.error("BIGDATACLOUD_API_KEY is required.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const targets = [];
  if (args.all) {
    const users = await User.find({}).select("_id displayName");
    users.forEach((u) => targets.push(u._id));
  } else if (args.userId) {
    targets.push(args.userId);
  } else {
    console.error("Specify a userId or --all");
    process.exit(1);
  }

  for (const userId of targets) {
    console.log(`\n[Albums] Generating for user ${userId}`);
    try {
      const result = await generateLocationAlbumsForUser(userId, {
        minPhotos: args.minPhotos,
        levels: args.levels,
      });
      console.log(
        `  -> ${result.albums.length} album(s), ${result.summary.photosWithGps}/${result.summary.totalPhotos} photos with GPS`,
      );
    } catch (error) {
      console.error(`  x Failed for ${userId}: ${error.message}`);
    }
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
