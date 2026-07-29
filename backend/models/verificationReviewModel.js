const mongoose = require("mongoose");
const {
  REVIEW_TARGET_TYPES,
  REVIEW_STATUSES,
  VERIFICATION_CHECK_TYPES,
  CHECK_STATUSES,
} = require("./modelEnums");

const verificationCheckSchema = new mongoose.Schema(
  {
    checkType: {
      type: String,
      enum: VERIFICATION_CHECK_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: CHECK_STATUSES,
      default: "PENDING",
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  { _id: false }
);

const verificationReviewSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: REVIEW_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: "PENDING",
      index: true,
    },
    verificationChecks: {
      type: [verificationCheckSchema],
      default: [],
    },
    evidenceMediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    adminComment: {
      type: String,
      trim: true,
      default: null,
      select: false,
    },
    publicVerificationNote: {
      type: String,
      trim: true,
      default: null,
    },
    reviewedAt: {
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

verificationReviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
verificationReviewSchema.index({ status: 1, reviewedBy: 1, createdAt: 1 });

const VerificationReview =
  mongoose.models.VerificationReview ||
  mongoose.model("VerificationReview", verificationReviewSchema, "verification_reviews");

module.exports = VerificationReview;
