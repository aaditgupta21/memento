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

// Validation: at least one image required
postSchema.path("images").validate(function (images) {
  return images && images.length > 0;
}, "At least one image is required");

// Ensure virtuals are included when converting to JSON
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
