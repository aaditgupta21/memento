const express = require("express");
const router = express.Router();
const { extractExifFromUrl } = require("../geospatial/EXIFReader");

/**
 * POST /api/exif/extract
 * Extract EXIF metadata from an image URL
 * Used by UploadThing onUploadComplete hook to get EXIF data
 * Public endpoint - no auth required (images are already uploaded to UploadThing)
 */
router.post("/extract", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: "imageUrl required",
      });
    }

    // Extract EXIF data from URL
    const exifData = await extractExifFromUrl(imageUrl);

    res.json({
      success: true,
      exif: exifData,
    });
  } catch (error) {
    console.error("[EXIF] Extraction error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
