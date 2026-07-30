const mongoose = require("mongoose");
const {
  DOCUMENTARY_CONTENT_TYPES,
  DOCUMENTARY_ITEM_STATUSES,
  PUBLIC_VERIFICATION_STATUSES,
  SENSITIVITY_LEVELS,
} = require("./modelEnums");

const documentaryItemSchema = new mongoose.Schema(
  {
    sourceSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentarySubmission",
      default: null,
    },
    contentType: {
      type: String,
      enum: DOCUMENTARY_CONTENT_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    titleBn: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    body: {
      type: String,
      default: null,
    },
    coverMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
    mediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JulyEvent",
      default: null,
      index: true,
    },
    eventDate: {
      type: Date,
      default: null,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },
    locationDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    contributorDisplayName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    contributorIsAnonymous: {
      type: Boolean,
      default: false,
    },
    verificationSummary: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: PUBLIC_VERIFICATION_STATUSES,
      default: "UNVERIFIED",
      index: true,
    },
    sourceLabel: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
    sensitivityLevel: {
      type: String,
      enum: SENSITIVITY_LEVELS,
      default: "NONE",
      index: true,
    },
    contentWarning: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    status: {
      type: String,
      enum: DOCUMENTARY_ITEM_STATUSES,
      default: "DRAFT",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
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

documentaryItemSchema.index(
  { sourceSubmissionId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceSubmissionId: { $type: "objectId" } },
  }
);
documentaryItemSchema.index({ status: 1, featured: -1, publishedAt: -1 });
documentaryItemSchema.index({ status: 1, deletedAt: 1, locationId: 1, contentType: 1, _id: -1 });
documentaryItemSchema.index({ eventId: 1, status: 1, publishedAt: -1 });
documentaryItemSchema.index({ tagIds: 1, status: 1, publishedAt: -1 });
documentaryItemSchema.index({ title: "text", titleBn: "text", summary: "text", body: "text" });

const DocumentaryItem =
  mongoose.models.DocumentaryItem ||
  mongoose.model("DocumentaryItem", documentaryItemSchema, "documentary_items");

module.exports = DocumentaryItem;
