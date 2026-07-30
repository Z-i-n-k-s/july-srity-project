const mongoose = require("mongoose");

const siteSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updatedAt" },
    versionKey: false,
  }
);

const SiteSetting =
  mongoose.models.SiteSetting ||
  mongoose.model("SiteSetting", siteSettingSchema, "site_settings");

module.exports = SiteSetting;
