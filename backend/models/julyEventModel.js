const mongoose = require("mongoose");
const geoPointSchema = require("./shared/geoPointSchema");
const { EVENT_TYPES, EVENT_STATUSES } = require("./modelEnums");

const julyEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    titleBn: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
    eventDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      default: null,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },
    geoLocation: {
      type: geoPointSchema,
      default: undefined,
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      default: "OTHER",
      index: true,
    },
    tagIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    coverMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "DRAFT",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    publishedAt: {
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

julyEventSchema.index({ status: 1, eventDate: -1 });
julyEventSchema.index({ tagIds: 1, eventDate: -1 });
julyEventSchema.index({ geoLocation: "2dsphere" });

const JulyEvent =
  mongoose.models.JulyEvent ||
  mongoose.model("JulyEvent", julyEventSchema, "july_events");

module.exports = JulyEvent;
