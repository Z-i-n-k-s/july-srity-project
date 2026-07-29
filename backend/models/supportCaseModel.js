const mongoose = require("mongoose");
const {
  SUPPORT_RELATIONSHIPS,
  SUPPORT_TYPES,
  INJURY_LEVELS,
  SUPPORT_PRIORITIES,
  SUPPORT_CASE_STATUSES,
} = require("./modelEnums");

const supportCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    injuredPersonUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    requestRelationship: {
      type: String,
      enum: SUPPORT_RELATIONSHIPS,
      required: true,
    },
    supportTypes: {
      type: [{ type: String, enum: SUPPORT_TYPES }],
      default: [],
    },
    injuryLevel: {
      type: String,
      enum: INJURY_LEVELS,
      default: "NEEDS_ATTENTION",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },
    priority: {
      type: String,
      enum: SUPPORT_PRIORITIES,
      default: "NORMAL",
      index: true,
    },
    status: {
      type: String,
      enum: SUPPORT_CASE_STATUSES,
      default: "NEW",
      index: true,
    },
    assignedAdminIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    duplicateOfCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportCase",
      default: null,
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
    resolvedAt: {
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

supportCaseSchema.path("supportTypes").validate(
  (value) => Array.isArray(value) && value.length > 0,
  "At least one support type is required."
);
supportCaseSchema.index(
  { conversationId: 1 },
  {
    unique: true,
    partialFilterExpression: { conversationId: { $type: "objectId" } },
  }
);
supportCaseSchema.index({ createdBy: 1, createdAt: -1 });
supportCaseSchema.index(
  { createdBy: 1, clientDraftId: 1 },
  { unique: true, partialFilterExpression: { clientDraftId: { $type: "string" } } }
);
supportCaseSchema.index({ status: 1, priority: -1, submittedAt: 1 });
supportCaseSchema.index({ assignedAdminIds: 1, status: 1 });

const SupportCase =
  mongoose.models.SupportCase ||
  mongoose.model("SupportCase", supportCaseSchema, "support_cases");

module.exports = SupportCase;
