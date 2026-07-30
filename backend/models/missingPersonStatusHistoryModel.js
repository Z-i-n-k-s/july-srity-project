const mongoose = require("mongoose");
const { MISSING_PERSON_STATUSES } = require("./modelEnums");

const missingPersonStatusHistorySchema = new mongoose.Schema(
  {
    missingPersonReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MissingPersonReport",
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: MISSING_PERSON_STATUSES,
      default: null,
    },
    newStatus: {
      type: String,
      enum: MISSING_PERSON_STATUSES,
      required: true,
      index: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publicNote: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    privateNote: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
      select: false,
    },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
    versionKey: false,
  }
);

missingPersonStatusHistorySchema.index({ missingPersonReportId: 1, createdAt: -1 });

const MissingPersonStatusHistory =
  mongoose.models.MissingPersonStatusHistory ||
  mongoose.model("MissingPersonStatusHistory", missingPersonStatusHistorySchema, "missing_person_status_history");

module.exports = MissingPersonStatusHistory;
