const mongoose = require("mongoose");
const {
  MODERATION_TARGET_TYPES,
  MODERATION_REASONS,
  MODERATION_REPORT_STATUSES,
} = require("./modelEnums");

const moderationReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: MODERATION_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: MODERATION_REASONS,
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
    status: {
      type: String,
      enum: MODERATION_REPORT_STATUSES,
      default: "OPEN",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

moderationReportSchema.index({ targetType: 1, targetId: 1, status: 1 });
moderationReportSchema.index({ status: 1, createdAt: 1 });

const ModerationReport =
  mongoose.models.ModerationReport ||
  mongoose.model("ModerationReport", moderationReportSchema, "moderation_reports");

module.exports = ModerationReport;
