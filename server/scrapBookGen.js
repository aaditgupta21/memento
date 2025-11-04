const path = require("path");
const fs = require("fs/promises");
const { existsSync } = require("fs");
const mongoose = require("mongoose");
const exifr = require("exifr");
require("dotenv").config();

const DEFAULT_IMAGE_EXTENSIONS = new Set([
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
  ".heic",
  ".webp",
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
    console.log(
      `Loaded ${scrapbookEntries.length} images from ${
        useDb ? `MongoDB Atlas (${collectionName})` : targetDir
      }`,
    );
    if (scrapbookEntries.length) {
      console.dir(scrapbookEntries[0], { depth: null });
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadScrapbookEntries,
  loadScrapbookEntriesFromDb,
  fetchImagesFromDb,
  extractExifMetadata,
};
