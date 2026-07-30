const mongoose = require("mongoose");

const messageReceiptSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

messageReceiptSchema.index({ messageId: 1, userId: 1 }, { unique: true });
messageReceiptSchema.index({ userId: 1, readAt: 1 });

const MessageReceipt =
  mongoose.models.MessageReceipt ||
  mongoose.model("MessageReceipt", messageReceiptSchema, "message_receipts");

module.exports = MessageReceipt;
