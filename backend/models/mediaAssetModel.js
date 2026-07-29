const mongoose = require("mongoose");
const {
  STORAGE_PROVIDERS,
  FILE_TYPES,
  MEDIA_VISIBILITIES,
  UPLOAD_STATUSES,
  MODERATION_STATUSES,
} = require("./modelEnums");

const mediaAssetSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    storageProvider: {
      type: String,
      enum: STORAGE_PROVIDERS,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
      default: null,
    },
    secureUrl: {
      type: String,
      trim: true,
      default: null,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      enum: FILE_TYPES,
      required: true,
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    width: {
      type: Number,
      min: 0,
      default: null,
    },
    height: {
      type: Number,
      min: 0,
      default: null,
    },
    durationSeconds: {
      type: Number,
      min: 0,
      default: null,
    },
    thumbnailMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
    visibility: {
      type: String,
      enum: MEDIA_VISIBILITIES,
      default: "PRIVATE",
      index: true,
    },
    uploadStatus: {
      type: String,
      enum: UPLOAD_STATUSES,
      default: "UPLOADING",
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: MODERATION_STATUSES,
      default: "PENDING",
      index: true,
    },
    checksum: {
      type: String,
      trim: true,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

mediaAssetSchema.index({ storageProvider: 1, storageKey: 1 }, { unique: true });
mediaAssetSchema.index({ checksum: 1, fileSize: 1 });
mediaAssetSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaAssetSchema.index({ uploadStatus: 1, moderationStatus: 1 });

const MediaAsset =
  mongoose.models.MediaAsset ||
  mongoose.model("MediaAsset", mediaAssetSchema, "media_assets");

module.exports = MediaAsset;
