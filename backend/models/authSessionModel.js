const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    deviceName: {
      type: String,
      trim: true,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
      select: false,
    },
    userAgent: {
      type: String,
      default: null,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AuthSession =
  mongoose.models.AuthSession ||
  mongoose.model("AuthSession", authSessionSchema, "auth_sessions");

module.exports = AuthSession;
