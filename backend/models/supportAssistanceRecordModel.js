const mongoose = require("mongoose");
const { ASSISTANCE_TYPES, ASSISTANCE_STATUSES } = require("./modelEnums");

const supportAssistanceRecordSchema = new mongoose.Schema(
  {
    supportCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportCase",
      required: true,
      index: true,
    },
    assistanceType: {
      type: String,
      enum: ASSISTANCE_TYPES,
      required: true,
      index: true,
    },
    providerName: {
      type: String,
      trim: true,
      maxlength: 250,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
      validate: {
        validator(value) {
          return value == null || Number(value.toString()) >= 0;
        },
        message: "Amount cannot be negative.",
      },
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
      default: "BDT",
    },
    status: {
      type: String,
      enum: ASSISTANCE_STATUSES,
      default: "PLANNED",
      index: true,
    },
    evidenceMediaIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MediaAsset",
      },
    ],
    providedAt: {
      type: Date,
      default: null,
      index: true,
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

supportAssistanceRecordSchema.index({ supportCaseId: 1, createdAt: -1 });
supportAssistanceRecordSchema.index({ status: 1, providedAt: -1 });

const SupportAssistanceRecord =
  mongoose.models.SupportAssistanceRecord ||
  mongoose.model("SupportAssistanceRecord", supportAssistanceRecordSchema, "support_assistance_records");

module.exports = SupportAssistanceRecord;
