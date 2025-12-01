const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema({
  images: [
    {
      url: {
        type: String,
        required: true,
      },
      order: {
        type: Number,
        default: 0,
      },
      exif: {
        latitude: {
          type: Number,
          required: false,
          min: -90,
          max: 90,
        },
        longitude: {
          type: Number,
          required: false,
          min: -180,
          max: 180,
        },
        timestamp: {
          type: Date,
          required: false,
        },
        cameraModel: {
          type: String,
          required: false,
          maxlength: 200,
        },
      },
    },
  ],
  categories: [
    {
      type: String,
      enum: [
        "Travel",
        "Sports",
        "Gaming",
        "Lifestyle",
        "Food",
        "Fitness",
        "Fashion",
        "Beauty",
        "Wellness",
        "Home",
        "Family",
        "Art",
        "Music",
        "Photography",
        "Nature",
      ],
    },
  ],
  caption: {
    type: String,
    required: false,
    default: "",
  },
  location: {
    type: String,
    required: false,
  },
  geolocation: {
    lat: Number,
    lng: Number,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [commentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual to get like count
postSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Virtual to get comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Virtual to get image count
postSchema.virtual("imageCount").get(function () {
  return this.images.length;
});

// Virtual to get images with GPS data
postSchema.virtual("imagesWithGPS").get(function () {
  return this.images.filter(
    (img) => img.exif?.latitude != null && img.exif?.longitude != null
  );
});

// Virtual to check if post has any GPS data
postSchema.virtual("hasGPS").get(function () {
  return this.images.some(
    (img) => img.exif?.latitude != null && img.exif?.longitude != null
  );
});

// Validation: at least one image required
postSchema.path("images").validate(function (images) {
  return images && images.length > 0;
}, "At least one image is required");

// Ensure virtuals are included when converting to JSON
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// ============================================================================
// AUTO-UPDATE SCRAPBOOKS
// ============================================================================

function scheduleLocationAlbumRefresh(authorId) {
  if (!authorId) return;
  // Run off-thread to avoid blocking the request lifecycle
  setImmediate(() => {
    (async () => {
      try {
        const { generateLocationAlbumsForUser } = require("../utils/locationAlbumGenerator");
        await generateLocationAlbumsForUser(authorId, { minPhotos: 10 });
      } catch (error) {
        console.warn("[LocationAlbums] Refresh skipped:", error.message);
      }
    })().catch((error) => {
      // Catch any unhandled promise rejections
      console.warn("[LocationAlbums] Unhandled error in refresh:", error.message);
    });
  });
}

// Store original categories when document is initialized (for tracking changes)
postSchema.post("init", function () {
  this._originalCategories = this.categories ? [...this.categories] : [];
});

// Track whether this is a new post and category changes for scrapbook syncing
postSchema.pre("save", function (next) {
  // Track if this is a new post (isNew will be false in post-save hook)
  this._wasNew = this.isNew;

  // Track category changes
  if (!this.isNew && this.isModified("categories")) {
    this._categoriesChanged = true;
    this._oldCategories = this._originalCategories || [];
  }
  next();
});

// Auto-update scrapbooks when post is created or categories change
postSchema.post("save", async function (doc) {
  const { updateAllScrapbooks, checkAndGenerateScrapbooks, syncGenreScrapbooks } = require("../utils/scrapbookUpdater");

  if (this._wasNew) {
    // New post - check thresholds and generate scrapbooks if needed, then update existing ones
    await checkAndGenerateScrapbooks(doc, 6); // Minimum 6 posts to create a scrapbook
    await updateAllScrapbooks(doc);
    // Store current categories as baseline for future updates
    this._originalCategories = this.categories ? [...this.categories] : [];
    scheduleLocationAlbumRefresh(doc.author);
  } else if (this._categoriesChanged) {
    // Categories changed - sync genre scrapbooks
    await syncGenreScrapbooks(doc, this._oldCategories || []);
    // Update baseline with new categories
    this._originalCategories = this.categories ? [...this.categories] : [];
  }
});

// Remove post from scrapbooks when deleted (using findOneAndDelete)
postSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  const { removePostFromScrapbooks } = require("../utils/scrapbookUpdater");
  await removePostFromScrapbooks(doc._id);
  scheduleLocationAlbumRefresh(doc.author);
});

// Remove post from scrapbooks when deleted (using deleteOne/remove)
postSchema.post("deleteOne", { document: true, query: false }, async function (doc) {
  const { removePostFromScrapbooks } = require("../utils/scrapbookUpdater");
  await removePostFromScrapbooks(this._id);
  scheduleLocationAlbumRefresh(this.author);
});

module.exports = mongoose.model("Post", postSchema);
