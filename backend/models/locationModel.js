const mongoose = require("mongoose");
const geoPointSchema = require("./shared/geoPointSchema");
const { LOCATION_TYPES } = require("./modelEnums");

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    nameBn: {
      type: String,
      trim: true,
      maxlength: 150,
      default: null,
    },
    type: {
      type: String,
      enum: LOCATION_TYPES,
      required: true,
      index: true,
    },
    parentLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
      index: true,
    },
    geoLocation: {
      type: geoPointSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

locationSchema.index({ parentLocationId: 1, type: 1, name: 1 });
locationSchema.index({ geoLocation: "2dsphere" });

const Location =
  mongoose.models.Location ||
  mongoose.model("Location", locationSchema, "locations");

module.exports = Location;
