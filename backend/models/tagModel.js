const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    nameBn: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

tagSchema.index({ name: 1 });
tagSchema.index({ nameBn: 1 });

const Tag =
  mongoose.models.Tag ||
  mongoose.model("Tag", tagSchema, "tags");

module.exports = Tag;
