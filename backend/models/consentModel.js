const mongoose = require("mongoose");
const { CONSENT_TARGET_TYPES, CONSENT_TYPES } = require("./modelEnums");

const consentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: CONSENT_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    consentType: {
      type: String,
      enum: CONSENT_TYPES,
      required: true,
      index: true,
    },
    granted: {
      type: Boolean,
      required: true,
      index: true,
    },
    consentTextVersion: {
      type: String,
      required: true,
      trim: true,
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
    grantedAt: {
      type: Date,
      required() {
        return this.granted === true;
      },
      default: null,
    },
    withdrawnAt: {
      type: Date,
      required() {
        return this.granted === false;
      },
      default: null,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

consentSchema.index({ userId: 1, targetType: 1, targetId: 1, consentType: 1, grantedAt: -1 });

const Consent =
  mongoose.models.Consent ||
  mongoose.model("Consent", consentSchema, "consents");

module.exports = Consent;
