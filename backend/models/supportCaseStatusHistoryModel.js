const mongoose = require("mongoose");
const { SUPPORT_CASE_STATUSES } = require("./modelEnums");

const supportCaseStatusHistorySchema = new mongoose.Schema(
  {
    supportCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportCase",
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: SUPPORT_CASE_STATUSES,
      default: null,
    },
    newStatus: {
      type: String,
      enum: SUPPORT_CASE_STATUSES,
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

supportCaseStatusHistorySchema.index({ supportCaseId: 1, createdAt: -1 });

const SupportCaseStatusHistory =
  mongoose.models.SupportCaseStatusHistory ||
  mongoose.model("SupportCaseStatusHistory", supportCaseStatusHistorySchema, "support_case_status_history");

module.exports = SupportCaseStatusHistory;
