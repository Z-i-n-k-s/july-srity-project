const mongoose = require("mongoose");
const geoPointSchema = require("./shared/geoPointSchema");
const { MISSING_PERSON_STATUSES } = require("./modelEnums");

const personSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 150 },
    nickname: { type: String, trim: true, maxlength: 100, default: null },
    age: { type: Number, min: 0, max: 130, default: null },
    gender: { type: String, trim: true, default: null },
    publicDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    clothingDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    identifyingMarks: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
  },
  { _id: false }
);

const lastSeenSchema = new mongoose.Schema(
  {
    dateTime: { type: Date, required: true, index: true },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    addressDescription: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: null,
    },
    geoLocation: {
      type: geoPointSchema,
      default: undefined,
    },
  },
  { _id: false }
);

const missingPersonReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      default: null,
    },
    person: {
      type: personSchema,
      required: true,
    },
    profileMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },
    lastSeen: {
      type: lastSeenSchema,
      required: true,
    },
    relatedJulyEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JulyEvent",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: MISSING_PERSON_STATUSES,
      default: "DRAFT",
      index: true,
    },
    publicContactAllowed: {
      type: Boolean,
      default: false,
    },
    publicContactNumber: {
      type: String,
      trim: true,
      required() {
        return this.publicContactAllowed === true;
      },
      default: null,
    },
    assignedAdminIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    duplicateOfReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MissingPersonReport",
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },
    foundAt: {
      type: Date,
      required() {
        return ["FOUND_ALIVE", "FOUND_DECEASED"].includes(this.status);
      },
      default: null,
    },
    deletedAt: {
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

missingPersonReportSchema.index(
  { conversationId: 1 },
  {
    unique: true,
    partialFilterExpression: { conversationId: { $type: "objectId" } },
  }
);
missingPersonReportSchema.index({ reportedBy: 1, createdAt: -1 });
missingPersonReportSchema.index({ status: 1, publishedAt: -1 });
missingPersonReportSchema.index({ assignedAdminIds: 1, status: 1 });
missingPersonReportSchema.index({ "lastSeen.dateTime": -1, status: 1 });
missingPersonReportSchema.index({ "lastSeen.geoLocation": "2dsphere" });
missingPersonReportSchema.index({ "person.fullName": "text", "person.nickname": "text", "person.publicDescription": "text" });

const MissingPersonReport =
  mongoose.models.MissingPersonReport ||
  mongoose.model("MissingPersonReport", missingPersonReportSchema, "missing_person_reports");

module.exports = MissingPersonReport;
