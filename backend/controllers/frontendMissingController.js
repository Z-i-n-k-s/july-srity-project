const MissingPersonReport = require("../models/missingPersonReportModel");
const MissingPersonPrivateDetail = require("../models/missingPersonPrivateDetailModel");
const MissingPersonSighting = require("../models/missingPersonSightingModel");
const MissingPersonStatusHistory = require("../models/missingPersonStatusHistoryModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const User = require("../models/userModel");
const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { generatePublicNumber } = require("../helpers/identifiers");
const { saveUploadedFile } = require("../helpers/frontendUpload");
const { encryptField } = require("../helpers/security");
const {
  asBoolean,
  combineDateAndTime,
  formatDate,
  formatTime,
  mediaUrl,
  missingStatus,
  isObjectId,
} = require("../helpers/frontendCompatibility");

function reportFilter(id) {
  return isObjectId(id)
    ? { $or: [{ _id: id }, { reportNumber: id }] }
    : { reportNumber: id };
}

async function findReport(id) {
  return MissingPersonReport.findOne({ ...reportFilter(id), deletedAt: null });
}

function serializePublic(report) {
  return {
    id: report.reportNumber || String(report._id),
    _id: String(report._id),
    name: report.person?.fullName || "Unknown",
    age: report.person?.age ?? "—",
    lastSeenLocation:
      report.lastSeen?.locationId?.name ||
      report.lastSeen?.locationId?.nameBn ||
      report.lastSeen?.addressDescription ||
      "Location not specified",
    lastSeenDate: formatDate(report.lastSeen?.dateTime),
    verified: report.status === "VERIFIED_MISSING",
    image: mediaUrl(report.profileMediaId),
    photo: mediaUrl(report.profileMediaId),
    clothing: report.person?.clothingDescription || "Not specified",
    description: report.person?.publicDescription || "",
    status: missingStatus(report.status),
  };
}

function serializeAdminList(report, privateDetails, sightingsCount = 0) {
  const reporter = privateDetails?.reporterDetails || {};
  return {
    ...serializePublic(report),
    id: report.reportNumber || String(report._id),
    _id: String(report._id),
    reporter: reporter.fullName || report.reportedBy?.name || "Reporter",
    relationship: reporter.relationship || "Not specified",
    priority: report.status === "PENDING_REVIEW" ? "Normal" : "Normal",
    sightings: sightingsCount,
  };
}
function populateReport(query) {
  return query
    .populate("profileMediaId", "secureUrl url originalName mimeType fileSize moderationStatus")
    .populate("lastSeen.locationId", "name nameBn type")
    .populate("reportedBy", "name email phone")
    .populate("assignedAdminIds", "name email");
}

const createReport = asyncHandler(async (req, res) => {
  const {
    name,
    age,
    relationship,
    lastSeenDate,
    lastSeenLocation,
    clothing,
    description,
    reporterContact,
  } = req.body;

  if (!name?.trim()) throw new AppError("The missing person's name is required.", 422, "MISSING_NAME_REQUIRED");
  if (!lastSeenDate) throw new AppError("The last-seen date is required.", 422, "LAST_SEEN_DATE_REQUIRED");
  if (!lastSeenLocation?.trim()) throw new AppError("The last-seen location is required.", 422, "LAST_SEEN_LOCATION_REQUIRED");
  if (!description?.trim()) throw new AppError("A public description is required.", 422, "PUBLIC_DESCRIPTION_REQUIRED");
  if (!reporterContact?.trim()) throw new AppError("A private reporter contact is required.", 422, "REPORTER_CONTACT_REQUIRED");
  if (!asBoolean(req.body.visibilityConsent)) {
    throw new AppError("Consent is required before this report can be reviewed for public visibility.", 422, "VISIBILITY_CONSENT_REQUIRED");
  }
  if (!asBoolean(req.body.declaration)) {
    throw new AppError("Confirm that the report is accurate to the best of your knowledge.", 422, "REPORT_DECLARATION_REQUIRED");
  }

  let photo = null;
  if (req.file) {
    photo = await saveUploadedFile(req.file, {
      userId: req.userId,
      folder: "july-smriti/missing-persons",
      visibility: "PRIVATE",
    });
  }

  const report = await MissingPersonReport.create({
    reportNumber: generatePublicNumber("MPR"),
    reportedBy: req.userId,
    person: {
      fullName: name.trim(),
      age: age === "" || age == null ? null : Number(age),
      publicDescription: description.trim(),
      clothingDescription: clothing?.trim() || null,
    },
    profileMediaId: photo?._id || null,
    lastSeen: {
      dateTime: new Date(lastSeenDate),
      addressDescription: lastSeenLocation.trim(),
    },
    status: "PENDING_REVIEW",
    publicContactAllowed: false,
  });

  await MissingPersonPrivateDetail.create({
    missingPersonReportId: report._id,
    missingPersonDetails: {},
    reporterDetails: {
      fullName: req.user?.name || "Reporter",
      relationship: relationship?.trim() || "Not specified",
      phone: reporterContact.trim(),
    },
    evidenceMediaIds: photo ? [photo._id] : [],
  });

  const conversation = await Conversation.create({
    conversationNumber: generatePublicNumber("CONV"),
    type: "MISSING_PERSON_REVIEW",
    subjectType: "MISSING_PERSON_REPORT",
    subjectId: report._id,
    title: `Missing person review: ${report.person.fullName}`,
    createdBy: req.userId,
    status: "OPEN",
  });
  await ConversationParticipant.create({
    conversationId: conversation._id,
    userId: req.userId,
    participantRole: "OWNER",
    invitationStatus: "ACCEPTED",
    joinedAt: new Date(),
    permissions: {
      canSendMessages: true,
      canUploadDocuments: true,
      canInviteParticipants: false,
      canChangeStatus: false,
      canViewSensitiveFiles: true,
    },
  });
  report.conversationId = conversation._id;
  await report.save({ validateBeforeSave: false });

  await MissingPersonStatusHistory.create({
    missingPersonReportId: report._id,
    previousStatus: null,
    newStatus: "PENDING_REVIEW",
    changedBy: req.userId,
    publicNote: "Missing-person report submitted for administrator review.",
  });
  await Consent.create({
    userId: req.userId,
    targetType: "MISSING_PERSON_REPORT",
    targetId: report._id,
    consentType: "PUBLICATION",
    granted: true,
    consentTextVersion: process.env.CONSENT_TEXT_VERSION || "frontend-v1",
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    grantedAt: new Date(),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Missing-person report submitted for private administrator review.",
    data: { id: report.reportNumber, _id: String(report._id), status: missingStatus(report.status) },
  });
});

const listPublic = asyncHandler(async (_req, res) => {
  const reports = await populateReport(
    MissingPersonReport.find({ status: "VERIFIED_MISSING", deletedAt: null }).sort({ publishedAt: -1, createdAt: -1 })
  ).lean();
  return sendSuccess(res, {
    message: "Verified public missing-person reports retrieved successfully.",
    data: reports.map(serializePublic),
  });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await populateReport(MissingPersonReport.findOne({ ...reportFilter(req.params.id), deletedAt: null }));
  if (!report) throw new AppError("The requested missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");

  if (req.user?.role === "ADMIN") {
    const privateDetails = await MissingPersonPrivateDetail.findOne({ missingPersonReportId: report._id })
      .select("+missingPersonDetails +reporterDetails +familyContactIds +identityMediaIds +evidenceMediaIds")
      .lean();
    const sightings = await MissingPersonSighting.find({ missingPersonReportId: report._id })
      .select("+reporterPhoneEncrypted")
      .populate("submittedBy", "name email")
      .populate("locationId", "name nameBn")
      .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
      .sort({ sightingDateTime: -1 })
      .lean();

    const reportObject = report.toObject();
    if (!reportObject.lastSeen) reportObject.lastSeen = {};
    if (!reportObject.lastSeen.locationId && reportObject.lastSeen.addressDescription) {
      reportObject.lastSeen.locationId = {
        name: reportObject.lastSeen.addressDescription,
        nameBn: reportObject.lastSeen.addressDescription,
      };
    }
    return sendSuccess(res, {
      message: "Private missing-person report retrieved successfully.",
      data: { report: reportObject, privateDetails: privateDetails || null, sightings },
    });
  }

  if (report.status !== "VERIFIED_MISSING") {
    throw new AppError("This report is not available publicly.", 404, "PUBLIC_MISSING_REPORT_NOT_FOUND");
  }
  return sendSuccess(res, { message: "Missing-person report retrieved successfully.", data: serializePublic(report) });
});

const listMine = asyncHandler(async (req, res) => {
  const reports = await populateReport(
    MissingPersonReport.find({ reportedBy: req.userId, deletedAt: null }).sort({ updatedAt: -1 })
  ).lean();
  const data = reports.map((report) => ({
    ...serializePublic(report),
    id: report.reportNumber || String(report._id),
    status: missingStatus(report.status),
    updatedAt: formatTime(report.updatedAt),
  }));
  return sendSuccess(res, { message: "Your missing-person reports were retrieved successfully.", data });
});

const createSighting = asyncHandler(async (req, res) => {
  const report = await findReport(req.params.id);
  if (!report || report.status !== "VERIFIED_MISSING") {
    throw new AppError("An active verified missing-person report was not found.", 404, "ACTIVE_REPORT_NOT_FOUND");
  }
  if (!req.body.date || !req.body.location?.trim() || !req.body.details?.trim()) {
    throw new AppError("Date, location and sighting details are required.", 422, "SIGHTING_DETAILS_REQUIRED");
  }
  if (!asBoolean(req.body.consent)) {
    throw new AppError("Consent is required to submit a private sighting report.", 422, "SIGHTING_CONSENT_REQUIRED");
  }

  const sighting = await MissingPersonSighting.create({
    missingPersonReportId: report._id,
    submittedBy: req.userId,
    reporterName: req.user?.name || null,
    reporterPhoneEncrypted: req.body.contact ? encryptField(req.body.contact) : null,
    sightingDateTime: combineDateAndTime(req.body.date, req.body.time),
    locationDescription: req.body.location.trim(),
    description: req.body.details.trim(),
    confidence: "LOW",
    status: "SUBMITTED",
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Your sighting was submitted privately for administrator review.",
    data: { id: String(sighting._id), status: "Submitted" },
  });
});

const listAdmin = asyncHandler(async (_req, res) => {
  const reports = await populateReport(
    MissingPersonReport.find({ deletedAt: null }).sort({ createdAt: -1 })
  );
  const data = [];
  for (const report of reports) {
    const privateDetails = await MissingPersonPrivateDetail.findOne({ missingPersonReportId: report._id })
      .select("+reporterDetails")
      .lean();
    const sightingsCount = await MissingPersonSighting.countDocuments({ missingPersonReportId: report._id });
    data.push(serializeAdminList(report, privateDetails, sightingsCount));
  }
  return sendSuccess(res, { message: "Missing-person review queue retrieved successfully.", data });
});

const changeStatus = asyncHandler(async (req, res) => {
  const report = await findReport(req.params.id);
  if (!report) throw new AppError("The requested missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");

  const requested = String(req.body.status || "").toUpperCase();
  const nextStatus = requested === "REJECTED" ? "FALSE_REPORT" : requested;
  const allowed = [
    "PENDING_REVIEW",
    "NEEDS_INFORMATION",
    "VERIFIED_MISSING",
    "FOUND_ALIVE",
    "FOUND_DECEASED",
    "FALSE_REPORT",
    "CLOSED",
  ];
  if (!allowed.includes(nextStatus)) {
    throw new AppError("The requested missing-person status is invalid.", 422, "INVALID_MISSING_STATUS", { allowed });
  }

  const previousStatus = report.status;
  report.status = nextStatus;
  if (nextStatus === "VERIFIED_MISSING") {
    report.verifiedAt = new Date();
    report.publishedAt = report.publishedAt || new Date();
    if (report.profileMediaId) {
      await require("../models/mediaAssetModel").updateOne(
        { _id: report.profileMediaId },
        { $set: { moderationStatus: "APPROVED", visibility: "PUBLIC" } }
      );
    }
  }
  if (["FOUND_ALIVE", "FOUND_DECEASED"].includes(nextStatus)) {
    report.foundAt = req.body.foundAt ? new Date(req.body.foundAt) : new Date();
    report.publicContactAllowed = false;
    report.publicContactNumber = null;
  }
  await report.save();

  await MissingPersonStatusHistory.create({
    missingPersonReportId: report._id,
    previousStatus,
    newStatus: nextStatus,
    changedBy: req.userId,
    publicNote: req.body.publicNote || `Status changed to ${missingStatus(nextStatus)}.`,
    privateNote: req.body.privateNote || null,
  });

  return sendSuccess(res, {
    message: `Missing-person report marked ${missingStatus(nextStatus)}.`,
    data: { _id: String(report._id), id: report.reportNumber, status: nextStatus, statusLabel: missingStatus(nextStatus) },
  });
});

const assignAdmins = asyncHandler(async (req, res) => {
  const report = await findReport(req.params.id);
  if (!report) throw new AppError("The requested missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  const requested = Array.isArray(req.body.adminIds) && req.body.adminIds.length ? req.body.adminIds : [req.userId];
  const unique = [...new Set(requested.map(String))];
  const count = await User.countDocuments({ _id: { $in: unique }, role: "ADMIN", accountStatus: "ACTIVE", deletedAt: null });
  if (count !== unique.length) throw new AppError("Every assigned account must be an active administrator.", 422, "INVALID_ADMIN_ASSIGNMENT");
  report.assignedAdminIds = unique;
  await report.save();
  return sendSuccess(res, { message: "Missing-person report assigned successfully.", data: { adminIds: unique } });
});

const changeSightingStatus = asyncHandler(async (req, res) => {
  const report = await findReport(req.params.reportId);
  if (!report) throw new AppError("The requested missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  const status = String(req.body.status || "").toUpperCase().replace(/\s+/g, "_");
  const allowed = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED", "DUPLICATE"];
  if (!allowed.includes(status)) throw new AppError("The requested sighting status is invalid.", 422, "INVALID_SIGHTING_STATUS");
  const sighting = await MissingPersonSighting.findOne({ _id: req.params.sightingId, missingPersonReportId: report._id });
  if (!sighting) throw new AppError("The requested sighting was not found.", 404, "SIGHTING_NOT_FOUND");
  sighting.status = status;
  sighting.reviewedBy = req.userId;
  await sighting.save();
  return sendSuccess(res, { message: `Sighting marked ${status}.`, data: sighting });
});

module.exports = {
  createReport,
  listPublic,
  getReport,
  listMine,
  createSighting,
  listAdmin,
  changeStatus,
  assignAdmins,
  changeSightingStatus,
  serializePublic,
  reportFilter,
};
