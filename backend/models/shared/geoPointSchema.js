const mongoose = require("mongoose");

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    // GeoJSON order is always [longitude, latitude].
    coordinates: {
      type: [Number],
      validate: {
        validator(value) {
          if (!value || value.length === 0) return true;
          if (value.length !== 2) return false;
          const [longitude, latitude] = value;
          return (
            longitude >= -180 &&
            longitude <= 180 &&
            latitude >= -90 &&
            latitude <= 90
          );
        },
        message: "GeoJSON coordinates must be [longitude, latitude].",
      },
      default: undefined,
    },
  },
  { _id: false }
);

module.exports = geoPointSchema;
