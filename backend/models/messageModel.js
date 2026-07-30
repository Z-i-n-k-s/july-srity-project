const mongoose = require("mongoose");
const { MESSAGE_TYPES, MESSAGE_VISIBILITIES } = require("./modelEnums");

const messageSchema = new mongoose.Schema(
  {
    clientMessageId: {
      type: String,
      required: true,
      trim: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: MESSAGE_TYPES,
      default: "TEXT",
      index: true,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 20000,
      required() {
        return !["FILE", "IMAGE", "VIDEO"].includes(this.messageType);
      },
      default: "",
    },
    mediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    visibility: {
      type: String,
      enum: MESSAGE_VISIBILITIES,
      default: "ALL_PARTICIPANTS",
      index: true,
    },
    editedAt: {
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

messageSchema.path("mediaIds").validate(function validateMedia(value) {
  if (!["FILE", "IMAGE", "VIDEO"].includes(this.messageType)) return true;
  return Array.isArray(value) && value.length > 0;
}, "A file, image, or video message must contain at least one media asset.");

messageSchema.index(
  { conversationId: 1, senderId: 1, clientMessageId: 1 },
  { unique: true }
);
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

const Message =
  mongoose.models.Message ||
  mongoose.model("Message", messageSchema, "messages");

module.exports = Message;
