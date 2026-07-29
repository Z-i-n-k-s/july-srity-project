const mongoose = require("mongoose");
const {
  PARTICIPANT_ROLES,
  INVITATION_STATUSES,
} = require("./modelEnums");

const permissionsSchema = new mongoose.Schema(
  {
    canSendMessages: { type: Boolean, default: true },
    canUploadDocuments: { type: Boolean, default: true },
    canInviteParticipants: { type: Boolean, default: false },
    canChangeStatus: { type: Boolean, default: false },
    canViewSensitiveFiles: { type: Boolean, default: false },
  },
  { _id: false }
);

const conversationParticipantSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    participantRole: {
      type: String,
      enum: PARTICIPANT_ROLES,
      required: true,
      index: true,
    },
    permissions: {
      type: permissionsSchema,
      default: () => ({}),
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    invitationStatus: {
      type: String,
      enum: INVITATION_STATUSES,
      default: "PENDING",
      index: true,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

conversationParticipantSchema.index(
  { conversationId: 1, userId: 1 },
  { unique: true }
);
conversationParticipantSchema.index({ userId: 1, invitationStatus: 1 });

const ConversationParticipant =
  mongoose.models.ConversationParticipant ||
  mongoose.model("ConversationParticipant", conversationParticipantSchema, "conversation_participants");

module.exports = ConversationParticipant;
