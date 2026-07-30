const mongoose = require("mongoose");
const {
  DOCUMENT_REQUEST_TARGET_TYPES,
  DOCUMENT_TYPES,
  DOCUMENT_REQUEST_STATUSES,
} = require("./modelEnums");

const documentRequestSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: DOCUMENT_REQUEST_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: null,
    },
    required: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: DOCUMENT_REQUEST_STATUSES,
      default: "REQUESTED",
      index: true,
    },
    submittedMediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

documentRequestSchema.index({ conversationId: 1, status: 1, createdAt: -1 });
documentRequestSchema.index({ targetType: 1, targetId: 1, status: 1 });

const DocumentRequest =
  mongoose.models.DocumentRequest ||
  mongoose.model("DocumentRequest", documentRequestSchema, "document_requests");

module.exports = DocumentRequest;
