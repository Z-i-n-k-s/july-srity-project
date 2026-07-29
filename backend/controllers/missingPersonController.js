const MissingPersonReport = require("../models/missingPersonReportModel");
const User = require("../models/userModel");
const MissingPersonPrivateDetail = require("../models/missingPersonPrivateDetailModel");
const MissingPersonSighting = require("../models/missingPersonSightingModel");
const MissingPersonStatusHistory = require("../models/missingPersonStatusHistoryModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick, escapeRegex } = require("../helpers/query");
const { generatePublicNumber } = require("../helpers/identifiers");
const { encryptField } = require("../helpers/security");
const { requireOwnerOrAdmin, isAdmin } = require("../helpers/access");
const { assertTransition } = require("../helpers/statusTransitions");
const { createNotification, writeAudit } = require("../helpers/activity");
const { assertMediaAccessible, assertMediaPublishable } = require("../helpers/mediaValidation");
const { removeEncryptedFields } = require("../helpers/sanitize");

function privateSelect(query) {
  return query.select("+missingPersonDetails +reporterDetails +familyContactIds +identityMediaIds +evidenceMediaIds");
}

const listPublic = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "VERIFIED_MISSING", deletedAt: null };
  if (req.query.locationId) filter["lastSeen.locationId"] = req.query.locationId;
  if (req.query.gender) filter["person.gender"] = req.query.gender;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [
      { "person.fullName": q }, { "person.nickname": q },
      { "person.publicDescription": q }, { reportNumber: q },
    ];
  }
  const [reports, total] = await Promise.all([
    MissingPersonReport.find(filter)
      .select("-assignedAdminIds -duplicateOfReportId -conversationId")
      .populate({ path: "profileMediaId", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType" })
      .populate("lastSeen.locationId", "name nameBn type")
      .sort({ publishedAt: -1 }).skip(skip).limit(limit),
    MissingPersonReport.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Verified missing-person reports retrieved successfully.", data: reports, meta: paginationMeta({ page, limit, total }) });
});

const getPublic = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({
    _id: req.params.reportId,
    status: "VERIFIED_MISSING",
    deletedAt: null,
  })
    .select("-assignedAdminIds -duplicateOfReportId -conversationId")
    .populate({ path: "profileMediaId", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType" })
    .populate("lastSeen.locationId", "name nameBn type")
    .populate("relatedJulyEventId", "title titleBn slug eventDate");
  if (!report) throw new AppError("Verified missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  if (!report.publicContactAllowed) report.publicContactNumber = null;
  return sendSuccess(res, { message: "Missing-person report retrieved successfully.", data: report });
});

const create = asyncHandler(async (req, res) => {
  if (req.body.consent !== true && req.body.consentGranted !== true) {
    throw new AppError("Consent is required before a missing-person report can be saved.", 422, "CONSENT_REQUIRED");
  }
  const reportPayload = pick(req.body, [
    "person", "profileMediaId", "lastSeen", "relatedJulyEventId",
    "publicContactAllowed", "publicContactNumber",
  ]);
  await assertMediaAccessible(reportPayload.profileMediaId ? [reportPayload.profileMediaId] : [], {
    userId: req.userId,
    admin: isAdmin(req),
    allowPublic: true,
  });
  const privatePayload = req.body.privateDetails || {};
  await assertMediaAccessible([
    ...(privatePayload.identityMediaIds || []),
    ...(privatePayload.evidenceMediaIds || []),
  ], { userId: req.userId, admin: isAdmin(req), allowPublic: false });

  reportPayload.reportNumber = generatePublicNumber("MISS");
  reportPayload.reportedBy = req.userId;
  reportPayload.status = req.body.submitNow === true ? "PENDING_REVIEW" : "DRAFT";
  const report = await MissingPersonReport.create(reportPayload);

  try {
    if (privatePayload.missingPersonDetails) {
      const rawNationalId = privatePayload.missingPersonDetails.nationalIdNumber;
      delete privatePayload.missingPersonDetails.nationalIdNumber;
      delete privatePayload.missingPersonDetails.nationalIdNumberEncrypted;
      if (rawNationalId) privatePayload.missingPersonDetails.nationalIdNumberEncrypted = encryptField(rawNationalId);
    }
    const privateDetails = await MissingPersonPrivateDetail.create({
      missingPersonReportId: report._id,
      missingPersonDetails: privatePayload.missingPersonDetails || {},
      reporterDetails: privatePayload.reporterDetails || {
        fullName: req.body.reporterName || req.user.name,
        relationship: req.body.reporterRelationship || "Reporter",
        phone: req.body.reporterPhone || req.user.phone,
        alternativePhone: req.body.reporterAlternativePhone || null,
        address: req.body.reporterAddress || null,
      },
      familyContactIds: privatePayload.familyContactIds || [],
      identityMediaIds: privatePayload.identityMediaIds || [],
      evidenceMediaIds: privatePayload.evidenceMediaIds || [],
    });

    const conversation = await Conversation.create({
      conversationNumber: generatePublicNumber("CONV"),
      type: "MISSING_PERSON_REVIEW",
      subjectType: "MISSING_PERSON_REPORT",
      subjectId: report._id,
      title: `Missing-person report ${report.reportNumber}`,
      createdBy: req.userId,
      status: "OPEN",
    });
    await ConversationParticipant.create({
      conversationId: conversation._id,
      userId: req.userId,
      participantRole: "OWNER",
      invitationStatus: "ACCEPTED",
      joinedAt: new Date(),
      permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: true, canChangeStatus: false, canViewSensitiveFiles: true },
    });
    report.conversationId = conversation._id;
    await report.save();

    await MissingPersonStatusHistory.create({
      missingPersonReportId: report._id,
      previousStatus: null,
      newStatus: report.status,
      changedBy: req.userId,
      publicNote: report.status === "DRAFT" ? "Report draft created." : "Report submitted for review.",
    });
    await Consent.create({
      userId: req.userId,
      targetType: "MISSING_PERSON_REPORT",
      targetId: report._id,
      consentType: "DATA_PROCESSING",
      granted: true,
      consentTextVersion: process.env.CONSENT_TEXT_VERSION || "1.0",
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || null,
      grantedAt: new Date(),
    });

    await writeAudit(req, { action: "CREATE", targetType: "MISSING_PERSON_REPORT", targetId: report._id, after: report.toObject() });
    return sendSuccess(res, {
      statusCode: 201,
      message: report.status === "DRAFT" ? "Missing-person report draft saved." : "Missing-person report submitted for review.",
      data: { report, privateDetails: removeEncryptedFields(privateDetails) },
    });
  } catch (error) {
    const orphanConversation = await Conversation.findOne({ subjectType: "MISSING_PERSON_REPORT", subjectId: report._id }).select("_id");
    await Promise.allSettled([
      MissingPersonPrivateDetail.deleteOne({ missingPersonReportId: report._id }),
      MissingPersonStatusHistory.deleteMany({ missingPersonReportId: report._id }),
      Consent.deleteMany({ targetType: "MISSING_PERSON_REPORT", targetId: report._id }),
      orphanConversation ? ConversationParticipant.deleteMany({ conversationId: orphanConversation._id }) : Promise.resolve(),
      Conversation.deleteOne({ subjectType: "MISSING_PERSON_REPORT", subjectId: report._id }),
      MissingPersonReport.deleteOne({ _id: report._id }),
    ]);
    throw error;
  }
});

const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { reportedBy: req.userId, deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  const [reports, total] = await Promise.all([
    MissingPersonReport.find(filter).populate("profileMediaId", "secureUrl url originalName").sort({ createdAt: -1 }).skip(skip).limit(limit),
    MissingPersonReport.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Your missing-person reports were retrieved successfully.", data: reports, meta: paginationMeta({ page, limit, total }) });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.adminId) filter.assignedAdminIds = req.query.adminId;
  if (req.query.reportedBy) filter.reportedBy = req.query.reportedBy;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ "person.fullName": q }, { "person.nickname": q }, { reportNumber: q }];
  }
  const [reports, total] = await Promise.all([
    MissingPersonReport.find(filter)
      .populate("reportedBy", "name email phone")
      .populate("assignedAdminIds", "name email")
      .populate("profileMediaId", "secureUrl originalName")
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    MissingPersonReport.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Missing-person reports retrieved successfully.", data: reports, meta: paginationMeta({ page, limit, total }) });
});

const getPrivate = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null })
    .populate("reportedBy", "name email phone")
    .populate("assignedAdminIds", "name email")
    .populate("profileMediaId", "secureUrl originalName fileType");
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  requireOwnerOrAdmin(req, report, ["reportedBy"]);
  const [privateDetails, sightings, history] = await Promise.all([
    privateSelect(MissingPersonPrivateDetail.findOne({ missingPersonReportId: report._id })),
    MissingPersonSighting.find({ missingPersonReportId: report._id })
      .select(isAdmin(req) ? "+reporterPhoneEncrypted" : "-reporterPhoneEncrypted")
      .populate("submittedBy", "name email")
      .sort({ sightingDateTime: -1 }),
    MissingPersonStatusHistory.find({ missingPersonReportId: report._id })
      .select(isAdmin(req) ? "+privateNote" : "-privateNote")
      .populate("changedBy", "name role")
      .sort({ createdAt: 1 }),
  ]);
  await writeAudit(req, { action: "VIEW_SENSITIVE_DATA", targetType: "MISSING_PERSON_REPORT", targetId: report._id });
  return sendSuccess(res, {
    message: "Missing-person report retrieved successfully.",
    data: {
      report,
      privateDetails: removeEncryptedFields(privateDetails),
      sightings: removeEncryptedFields(sightings),
      history,
    },
  });
});

const update = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null });
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  requireOwnerOrAdmin(req, report, ["reportedBy"]);
  if (!isAdmin(req) && !["DRAFT", "NEEDS_INFORMATION"].includes(report.status)) {
    throw new AppError("This report cannot currently be edited by the reporter.", 422, "MISSING_REPORT_NOT_EDITABLE");
  }
  const before = report.toObject();
  if (Object.prototype.hasOwnProperty.call(req.body, "profileMediaId")) {
    await assertMediaAccessible(req.body.profileMediaId ? [req.body.profileMediaId] : [], {
      userId: req.userId,
      admin: isAdmin(req),
      allowPublic: true,
    });
  }
  Object.assign(report, pick(req.body, [
    "person", "profileMediaId", "lastSeen", "relatedJulyEventId",
    "publicContactAllowed", "publicContactNumber", "duplicateOfReportId",
  ]));
  await report.save();

  if (req.body.privateDetails) {
    const updates = { ...req.body.privateDetails };
    await assertMediaAccessible([
      ...(updates.identityMediaIds || []),
      ...(updates.evidenceMediaIds || []),
    ], { userId: req.userId, admin: isAdmin(req), allowPublic: false });
    if (updates.missingPersonDetails) {
      const rawNationalId = updates.missingPersonDetails.nationalIdNumber;
      delete updates.missingPersonDetails.nationalIdNumber;
      delete updates.missingPersonDetails.nationalIdNumberEncrypted;
      if (rawNationalId) updates.missingPersonDetails.nationalIdNumberEncrypted = encryptField(rawNationalId);
    }
    await MissingPersonPrivateDetail.findOneAndUpdate(
      { missingPersonReportId: report._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }
  await writeAudit(req, { action: "UPDATE", targetType: "MISSING_PERSON_REPORT", targetId: report._id, before, after: report.toObject() });
  return sendSuccess(res, { message: "Missing-person report updated successfully.", data: report });
});

const submitForReview = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null });
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  requireOwnerOrAdmin(req, report, ["reportedBy"]);
  assertTransition("MISSING_PERSON_REPORT", report.status, "PENDING_REVIEW");
  const previousStatus = report.status;
  report.status = "PENDING_REVIEW";
  await report.save();
  await MissingPersonStatusHistory.create({
    missingPersonReportId: report._id,
    previousStatus,
    newStatus: "PENDING_REVIEW",
    changedBy: req.userId,
    publicNote: "Report submitted for review.",
  });
  return sendSuccess(res, { message: "Missing-person report submitted for admin review.", data: report });
});

const assignAdmins = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null });
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  const adminIds = [...new Set((Array.isArray(req.body.adminIds) && req.body.adminIds.length ? req.body.adminIds : [req.userId]).map(String))];
  const validAdminCount = await User.countDocuments({ _id: { $in: adminIds }, role: "ADMIN", accountStatus: "ACTIVE", deletedAt: null });
  if (validAdminCount !== adminIds.length) throw new AppError("Every assigned user must be an active administrator.", 422, "INVALID_ADMIN_ASSIGNMENT");
  report.assignedAdminIds = adminIds;
  await report.save();
  if (report.conversationId) {
    await Conversation.findByIdAndUpdate(report.conversationId, { assignedAdminId: report.assignedAdminIds[0] });
    for (const adminId of report.assignedAdminIds) {
      await ConversationParticipant.findOneAndUpdate(
        { conversationId: report.conversationId, userId: adminId },
        {
          participantRole: "ADMIN", invitationStatus: "ACCEPTED", joinedAt: new Date(),
          permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: true, canChangeStatus: true, canViewSensitiveFiles: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
  return sendSuccess(res, { message: "Missing-person report assigned successfully.", data: report });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status, publicNote, privateNote, foundAt } = req.body;
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null });
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  assertTransition("MISSING_PERSON_REPORT", report.status, status);
  const previousStatus = report.status;
  const before = report.toObject();
  if (status === "VERIFIED_MISSING") {
    await assertMediaPublishable([report.profileMediaId]);
  }
  report.status = status;
  if (status === "VERIFIED_MISSING") { report.verifiedAt = new Date(); report.publishedAt = report.publishedAt || new Date(); }
  if (["FOUND_ALIVE", "FOUND_DECEASED"].includes(status)) {
    report.foundAt = foundAt ? new Date(foundAt) : new Date();
    report.publicContactAllowed = false;
    report.publicContactNumber = null;
  }
  await report.save();
  await MissingPersonStatusHistory.create({
    missingPersonReportId: report._id,
    previousStatus,
    newStatus: status,
    changedBy: req.userId,
    publicNote: publicNote || `Status changed to ${status}.`,
    privateNote: privateNote || null,
  });
  await createNotification({
    userId: report.reportedBy,
    type: "MISSING_PERSON_UPDATE",
    title: "Missing-person report updated",
    message: publicNote || `The report is now ${status}.`,
    entityType: "MISSING_PERSON_REPORT",
    entityId: report._id,
  });
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "MISSING_PERSON_REPORT", targetId: report._id, before, after: report.toObject() });
  return sendSuccess(res, { message: `Missing-person report status changed to ${status}.`, data: report });
});

const createSighting = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, status: "VERIFIED_MISSING", deletedAt: null });
  if (!report) throw new AppError("An active verified missing-person report was not found.", 404, "ACTIVE_REPORT_NOT_FOUND");
  await assertMediaAccessible(req.body.mediaIds || [], {
    userId: req.userId,
    admin: isAdmin(req),
    allowPublic: true,
  });
  const sighting = await MissingPersonSighting.create({
    missingPersonReportId: report._id,
    submittedBy: req.userId || null,
    reporterName: req.body.reporterName || req.user?.name || null,
    reporterPhoneEncrypted: req.body.reporterPhone ? encryptField(req.body.reporterPhone) : null,
    sightingDateTime: req.body.sightingDateTime,
    locationId: req.body.locationId || null,
    geoLocation: req.body.geoLocation || undefined,
    locationDescription: req.body.locationDescription,
    description: req.body.description,
    mediaIds: req.body.mediaIds || [],
    confidence: req.body.confidence || "LOW",
    status: "SUBMITTED",
  });
  for (const adminId of report.assignedAdminIds || []) {
    await createNotification({
      userId: adminId,
      type: "MISSING_PERSON_UPDATE",
      title: "New missing-person sighting",
      message: `A new sighting was submitted for report ${report.reportNumber}.`,
      entityType: "MISSING_PERSON_REPORT",
      entityId: report._id,
    });
  }
  return sendSuccess(res, {
    statusCode: 201,
    message: "Sighting submitted for private admin review. It will not be shown publicly before verification.",
    data: removeEncryptedFields(sighting),
  });
});

const changeSightingStatus = asyncHandler(async (req, res) => {
  const sighting = await MissingPersonSighting.findOne({ _id: req.params.sightingId, missingPersonReportId: req.params.reportId });
  if (!sighting) throw new AppError("Missing-person sighting was not found.", 404, "SIGHTING_NOT_FOUND");
  assertTransition("SIGHTING", sighting.status, req.body.status);
  sighting.status = req.body.status;
  sighting.reviewedBy = req.userId;
  await sighting.save();
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "MISSING_PERSON_SIGHTING", targetId: sighting._id, after: { status: sighting.status } });
  return sendSuccess(res, { message: `Sighting status changed to ${sighting.status}.`, data: sighting });
});

const remove = asyncHandler(async (req, res) => {
  const report = await MissingPersonReport.findOne({ _id: req.params.reportId, deletedAt: null });
  if (!report) throw new AppError("Missing-person report was not found.", 404, "MISSING_PERSON_NOT_FOUND");
  requireOwnerOrAdmin(req, report, ["reportedBy"]);
  if (!isAdmin(req) && !["DRAFT", "CLOSED"].includes(report.status)) {
    throw new AppError("This report cannot be deleted while it is active.", 422, "REPORT_DELETE_BLOCKED");
  }
  report.deletedAt = new Date();
  report.publicContactAllowed = false;
  report.publicContactNumber = null;
  await report.save({ validateBeforeSave: false });
  await writeAudit(req, { action: "DELETE", targetType: "MISSING_PERSON_REPORT", targetId: report._id, before: report.toObject() });
  return sendSuccess(res, { message: "Missing-person report deleted successfully.", data: null });
});

module.exports = {
  listPublic, getPublic, create, listMine, listAdmin, getPrivate, update,
  submitForReview, assignAdmins, changeStatus, createSighting, changeSightingStatus, remove,
};
