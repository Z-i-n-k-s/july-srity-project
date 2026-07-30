const mongoose = require("mongoose");
const geoPointSchema = require("./shared/geoPointSchema");
const {
  SIGHTING_CONFIDENCE_LEVELS,
  SIGHTING_STATUSES,
} = require("./modelEnums");

const missingPersonSightingSchema = new mongoose.Schema(
  {
    missingPersonReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MissingPersonReport",
      required: true,
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reporterName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
    reporterPhoneEncrypted: {
      type: String,
      default: null,
      select: false,
    },
    sightingDateTime: {
      type: Date,
      required: true,
      index: true,
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
    locationDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    mediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    confidence: {
      type: String,
      enum: SIGHTING_CONFIDENCE_LEVELS,
      default: "LOW",
      index: true,
    },
    status: {
      type: String,
      enum: SIGHTING_STATUSES,
      default: "SUBMITTED",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

missingPersonSightingSchema.index({ missingPersonReportId: 1, status: 1, sightingDateTime: -1 });
missingPersonSightingSchema.index({ geoLocation: "2dsphere" });

const MissingPersonSighting =
  mongoose.models.MissingPersonSighting ||
  mongoose.model("MissingPersonSighting", missingPersonSightingSchema, "missing_person_sightings");

module.exports = MissingPersonSighting;
