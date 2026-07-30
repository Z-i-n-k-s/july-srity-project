const mongoose = require("mongoose");
const {
  SUBMISSION_TYPES,
  SOURCE_TYPES,
  ANONYMITY_PREFERENCES,
  SUBMISSION_STATUSES,
} = require("./modelEnums");

const documentarySubmissionSchema = new mongoose.Schema(
  {
    submissionNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    clientDraftId: {
      type: String,
      trim: true,
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      enum: SUBMISSION_TYPES,
      required: true,
      index: true,
    },
    // Original human-readable type selected by the current frontend.
    frontendType: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
    storyContent: {
      type: String,
      default: null,
    },
    // Exact frontend selections are retained for reviewer/admin screens.
    contentTypes: {
      type: [String],
      default: [],
    },
    archiveVisibility: {
      type: String,
      trim: true,
      default: null,
    },
    publicationPermissionLabel: {
      type: String,
      trim: true,
      default: null,
    },
    identityPreferenceLabel: {
      type: String,
      trim: true,
      default: null,
    },
    publicAttributionLabel: {
      type: String,
      trim: true,
      maxlength: 160,
      default: null,
    },
    privacyControls: {
      removeMetadata: { type: Boolean, default: true },
      redactNames: { type: Boolean, default: false },
      protectFaces: { type: Boolean, default: false },
      protectVoices: { type: Boolean, default: false },
      allowAdminContact: { type: Boolean, default: true },
    },
    accuracyConfirmed: { type: Boolean, default: false },
    privacyConfirmed: { type: Boolean, default: false },
    mediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    eventDate: {
      type: Date,
      default: null,
      index: true,
    },
    locationDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JulyEvent",
      default: null,
      index: true,
    },
    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    sourceType: {
      type: String,
      enum: SOURCE_TYPES,
      default: "UNKNOWN",
    },
    sourceDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    isOriginalUploader: {
      type: Boolean,
      default: false,
    },
    originalSourceUrl: {
      type: String,
      trim: true,
      default: null,
    },
    correctionTargetItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentaryItem",
      default: null,
    },
    correctionReason: {
      type: String,
      trim: true,
      maxlength: 3000,
      required() {
        return this.submissionType === "CORRECTION";
      },
      default: null,
    },
    anonymityPreference: {
      type: String,
      enum: ANONYMITY_PREFERENCES,
      default: "SHOW_NAME",
    },
    pseudonym: {
      type: String,
      trim: true,
      maxlength: 100,
      required() {
        return this.anonymityPreference === "SHOW_PSEUDONYM";
      },
      default: null,
    },
    publicationConsent: {
      type: Boolean,
      default: false,
    },
    publicationConsentAt: {
      type: Date,
      required() {
        return this.publicationConsent === true;
      },
      default: null,
    },
    status: {
      type: String,
      enum: SUBMISSION_STATUSES,
      default: "DRAFT",
      index: true,
    },
    reviewLabel: {
      type: String,
      trim: true,
      default: null,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      required() {
        return this.status === "REJECTED";
      },
      default: null,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
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

documentarySubmissionSchema.index({ submittedBy: 1, createdAt: -1 });
documentarySubmissionSchema.index(
  { submittedBy: 1, clientDraftId: 1 },
  { unique: true, partialFilterExpression: { clientDraftId: { $type: "string" } } }
);
documentarySubmissionSchema.index({ status: 1, assignedAdminId: 1, submittedAt: 1 });
documentarySubmissionSchema.index({ eventId: 1, status: 1 });

const DocumentarySubmission =
  mongoose.models.DocumentarySubmission ||
  mongoose.model("DocumentarySubmission", documentarySubmissionSchema, "documentary_submissions");

module.exports = DocumentarySubmission;
