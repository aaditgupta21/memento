"use strict";

const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    caption: { type: String },
    location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date },
  },
  { _id: false },
);

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    level: { type: String },
    boundaryId: { type: String, required: true },
    coverImage: { type: String },
    photos: { type: [photoSchema], default: [] },
    photoCount: { type: Number, default: 0 },
    dateRange: { type: String },
    summary: { type: String },
  },
  { timestamps: true },
);

albumSchema.index({ owner: 1, boundaryId: 1 }, { unique: true });

module.exports = mongoose.model("Album", albumSchema);
