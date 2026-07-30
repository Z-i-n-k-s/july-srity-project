const mongoose = require("mongoose");
const {
  CONVERSATION_TYPES,
  CONVERSATION_SUBJECT_TYPES,
  CONVERSATION_STATUSES,
} = require("./modelEnums");

const conversationSchema = new mongoose.Schema(
  {
    conversationNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: CONVERSATION_TYPES,
      required: true,
      index: true,
    },
    subjectType: {
      type: String,
      enum: CONVERSATION_SUBJECT_TYPES,
      default: "NONE",
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: CONVERSATION_STATUSES,
      default: "OPEN",
      index: true,
    },
    lastMessageAt: {
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

conversationSchema.index({ createdBy: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ assignedAdminId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ subjectType: 1, subjectId: 1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema, "conversations");

module.exports = Conversation;
