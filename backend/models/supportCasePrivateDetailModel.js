const mongoose = require("mongoose");

const injuredPersonSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    alternativePhone: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    nationalIdNumberEncrypted: {
      type: String,
      default: null,
      select: false,
    },
  },
  { _id: false }
);

const injuryDetailsSchema = new mongoose.Schema(
  {
    injuryDate: { type: Date, default: null },
    injuryLocation: { type: String, trim: true, default: null },
    injuryDescription: { type: String, required: true, trim: true },
    currentCondition: { type: String, trim: true, default: null },
    hospitalName: { type: String, trim: true, default: null },
    doctorName: { type: String, trim: true, default: null },
    estimatedCost: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
      validate: {
        validator(value) {
          return value == null || Number(value.toString()) >= 0;
        },
        message: "Amount cannot be negative.",
      },
    },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: null },
    relationship: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const supportCasePrivateDetailSchema = new mongoose.Schema(
  {
    supportCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportCase",
      required: true,
      unique: true,
    },
    injuredPerson: {
      type: injuredPersonSchema,
      required: true,
      select: false,
    },
    injuryDetails: {
      type: injuryDetailsSchema,
      required: true,
      select: false,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: undefined,
      select: false,
    },
    medicalMediaIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MediaAsset",
        },
      ],
      default: [],
      select: false,
    },
    identityMediaIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MediaAsset",
        },
      ],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SupportCasePrivateDetail =
  mongoose.models.SupportCasePrivateDetail ||
  mongoose.model("SupportCasePrivateDetail", supportCasePrivateDetailSchema, "support_case_private_details");

module.exports = SupportCasePrivateDetail;
