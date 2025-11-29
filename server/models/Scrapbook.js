const mongoose = require("mongoose");

const scrapbookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    default: "",
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  coverImage: {
    type: String,
    required: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual to get post count
scrapbookSchema.virtual("postCount").get(function () {
  return this.posts.length;
});

// Update the updatedAt field before saving
scrapbookSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient scrapbook lookups by author and title
// Used by auto-update system to find/create scrapbooks quickly
scrapbookSchema.index({ author: 1, title: 1 });

// Ensure virtuals are included when converting to JSON
scrapbookSchema.set("toJSON", { virtuals: true });
scrapbookSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Scrapbook", scrapbookSchema);
