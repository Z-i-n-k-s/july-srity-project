const mongoose = require("mongoose");

const missingPersonDetailsSchema = new mongoose.Schema(
  {
    dateOfBirth: { type: Date, default: null },
    nationalIdNumberEncrypted: {
      type: String,
      default: null,
      select: false,
    },
    permanentAddress: { type: String, trim: true, default: null },
    medicalConditions: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const reporterDetailsSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternativePhone: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const missingPersonPrivateDetailSchema = new mongoose.Schema(
  {
    missingPersonReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MissingPersonReport",
      required: true,
      unique: true,
    },
    missingPersonDetails: {
      type: missingPersonDetailsSchema,
      required: true,
      select: false,
    },
    reporterDetails: {
      type: reporterDetailsSchema,
      required: true,
      select: false,
    },

    // The source table does not define which collection these IDs reference.
    // Keep them as ObjectIds until that relationship is decided.
    familyContactIds: {
      type: [mongoose.Schema.Types.ObjectId],
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
    evidenceMediaIds: {
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

const MissingPersonPrivateDetail =
  mongoose.models.MissingPersonPrivateDetail ||
  mongoose.model("MissingPersonPrivateDetail", missingPersonPrivateDetailSchema, "missing_person_private_details");

module.exports = MissingPersonPrivateDetail;
