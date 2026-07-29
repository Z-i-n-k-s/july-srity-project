const mongoose = require("mongoose");
const {
  DOCUMENTARY_CONTENT_TYPES,
  DOCUMENTARY_ITEM_STATUSES,
  PUBLIC_VERIFICATION_STATUSES,
  SENSITIVITY_LEVELS,
} = require("./modelEnums");

const documentaryVersionSchema = new mongoose.Schema(
  {
    documentaryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentaryItem", required: true, index: true },
    versionNumber: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    titleBn: { type: String, trim: true, default: null },
    slug: { type: String, trim: true, default: null },
    contentType: { type: String, enum: DOCUMENTARY_CONTENT_TYPES, required: true },
    summary: { type: String, trim: true, default: null },
    body: { type: String, default: null },
    coverMediaId: { type: mongoose.Schema.Types.ObjectId, ref: "MediaAsset", default: null },
    mediaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MediaAsset" }],
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "JulyEvent", default: null },
    eventDate: { type: Date, default: null },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location", default: null },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    contributorDisplayName: { type: String, trim: true, default: null },
    contributorIsAnonymous: { type: Boolean, default: false },
    verificationSummary: { type: String, trim: true, default: null },
    verificationStatus: { type: String, enum: PUBLIC_VERIFICATION_STATUSES, default: "UNVERIFIED" },
    sourceLabel: { type: String, trim: true, default: null },
    sensitivityLevel: { type: String, enum: SENSITIVITY_LEVELS, default: "NONE" },
    contentWarning: { type: String, trim: true, default: null },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: DOCUMENTARY_ITEM_STATUSES, required: true },
    changeReason: { type: String, required: true, trim: true, maxlength: 2000 },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false }, versionKey: false }
);

documentaryVersionSchema.index({ documentaryItemId: 1, versionNumber: 1 }, { unique: true });

const DocumentaryVersion =
  mongoose.models.DocumentaryVersion ||
  mongoose.model("DocumentaryVersion", documentaryVersionSchema, "documentary_versions");

module.exports = DocumentaryVersion;
