const mongoose = require("mongoose");

const documentaryVersionSchema = new mongoose.Schema(
  {
    documentaryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentaryItem",
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: null,
    },
    body: {
      type: String,
      default: null,
    },
    mediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    changeReason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

documentaryVersionSchema.index(
  { documentaryItemId: 1, versionNumber: 1 },
  { unique: true }
);

const DocumentaryVersion =
  mongoose.models.DocumentaryVersion ||
  mongoose.model("DocumentaryVersion", documentaryVersionSchema, "documentary_versions");

module.exports = DocumentaryVersion;
