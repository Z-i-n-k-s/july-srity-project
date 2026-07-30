const mongoose = require("mongoose");
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_ENTITY_TYPES,
} = require("./modelEnums");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    entityType: {
      type: String,
      enum: NOTIFICATION_ENTITY_TYPES,
      required: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ entityType: 1, entityId: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema, "notifications");

module.exports = Notification;
