const DocumentarySubmission = require("../models/documentarySubmissionModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Consent = require("../models/consentModel");
const User = require("../models/userModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick, escapeRegex } = require("../helpers/query");
const { generatePublicNumber } = require("../helpers/identifiers");
const { requireOwnerOrAdmin, isAdmin } = require("../helpers/access");
const { assertTransition } = require("../helpers/statusTransitions");
const { createNotification, writeAudit } = require("../helpers/activity");
const { assertMediaAccessible } = require("../helpers/mediaValidation");

const editableFields = [
  "submissionType", "title", "description", "storyContent", "mediaIds", "eventDate",
  "locationId", "locationDescription", "eventId", "tagIds", "sourceType", "sourceDescription",
  "isOriginalUploader", "originalSourceUrl", "anonymityPreference", "pseudonym",
  "publicationConsent", "correctionTargetItemId", "correctionReason",
];

async function recordPublicationConsent(req, submission, granted) {
  return Consent.create({
    userId: req.userId,
    targetType: "DOCUMENTARY_SUBMISSION",
    targetId: submission._id,
    consentType: "PUBLICATION",
    granted,
    consentTextVersion: process.env.CONSENT_TEXT_VERSION || "1.0",
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    grantedAt: granted ? new Date() : null,
    withdrawnAt: granted ? null : new Date(),
  });
}

async function validateSubmissionRules(payload) {
  if (payload.submissionType === "CORRECTION") {
    if (!payload.correctionTargetItemId || !payload.correctionReason?.trim()) {
      throw new AppError("Correction submissions require correctionTargetItemId and correctionReason.", 422, "CORRECTION_DETAILS_REQUIRED");
    }
    const target = await DocumentaryItem.exists({ _id: payload.correctionTargetItemId, deletedAt: null });
    if (!target) throw new AppError("The correction target archive item was not found.", 404, "CORRECTION_TARGET_NOT_FOUND");
  }
  if (["SOCIAL_MEDIA", "NEWS_SOURCE"].includes(payload.sourceType) && !payload.originalSourceUrl?.trim()) {
    throw new AppError("originalSourceUrl is required for social-media or news-source submissions.", 422, "ORIGINAL_SOURCE_URL_REQUIRED");
  }
  if (payload.anonymityPreference === "SHOW_PSEUDONYM" && !payload.pseudonym?.trim()) {
    throw new AppError("A pseudonym is required when the contributor chooses SHOW_PSEUDONYM.", 422, "PSEUDONYM_REQUIRED");
  }
}

async function assertSubmissionReady(payload, req) {
  if (!payload.publicationConsent) {
    throw new AppError("Publication consent is required before this record can be submitted.", 422, "PUBLICATION_CONSENT_REQUIRED");
  }
  if (!payload.storyContent && !payload.description && (!payload.mediaIds || payload.mediaIds.length === 0)) {
    throw new AppError("Add testimony text, a description, or at least one media file before submitting.", 422, "SUBMISSION_CONTENT_REQUIRED");
  }
  await validateSubmissionRules(payload);
  await assertMediaAccessible(payload.mediaIds || [], { userId: req.userId, admin: isAdmin(req), allowPublic: true });
}

async function ensureConversation(submission, userId) {
  if (submission.conversationId) return submission.conversationId;
  const conversation = await Conversation.create({
    conversationNumber: generatePublicNumber("CONV"),
    type: "DOCUMENTARY_REVIEW",
    subjectType: "DOCUMENTARY_SUBMISSION",
    subjectId: submission._id,
    title: `Review: ${submission.title}`,
    createdBy: userId,
    status: "OPEN",
  });
  await ConversationParticipant.create({
    conversationId: conversation._id,
    userId,
    participantRole: "OWNER",
    invitationStatus: "ACCEPTED",
    joinedAt: new Date(),
    permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: false, canChangeStatus: false, canViewSensitiveFiles: true },
  });
  submission.conversationId = conversation._id;
  return conversation._id;
}

const create = asyncHandler(async (req, res) => {
  if (req.body.clientDraftId) {
    const existing = await DocumentarySubmission.findOne({ submittedBy: req.userId, clientDraftId: req.body.clientDraftId, deletedAt: null });
    if (existing) {
      return sendSuccess(res, { message: "This offline testimony draft was already synchronized.", data: existing });
    }
  }
  const payload = pick(req.body, [...editableFields, "clientDraftId"]);
  await validateSubmissionRules(payload);
  await assertMediaAccessible(payload.mediaIds || [], { userId: req.userId, admin: isAdmin(req), allowPublic: true });
  if (req.body.submitNow === true) await assertSubmissionReady(payload, req);
  payload.submissionNumber = generatePublicNumber("SUB");
  payload.submittedBy = req.userId;
  payload.status = "DRAFT";
  if (payload.publicationConsent) payload.publicationConsentAt = new Date();
  const submission = await DocumentarySubmission.create(payload);

  if (payload.publicationConsent) await recordPublicationConsent(req, submission, true);

  if (req.body.submitNow === true) {
    await ensureConversation(submission, req.userId);
    submission.status = "SUBMITTED";
    submission.submittedAt = new Date();
    await submission.save();
  }

  await writeAudit(req, { action: "CREATE", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, after: submission.toObject() });
  return sendSuccess(res, {
    statusCode: 201,
    message: submission.status === "SUBMITTED" ? "Testimony submitted for review." : "Testimony draft saved successfully.",
    data: submission,
  });
});

const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { submittedBy: req.userId, deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.submissionType) filter.submissionType = req.query.submissionType;
  const [items, total] = await Promise.all([
    DocumentarySubmission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DocumentarySubmission.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Your documentary submissions were retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };
  for (const field of ["status", "submissionType", "sourceType", "assignedAdminId", "submittedBy"]) if (req.query[field]) filter[field] = req.query[field];
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ title: q }, { description: q }, { storyContent: q }, { submissionNumber: q }];
  }
  const [items, total] = await Promise.all([
    DocumentarySubmission.find(filter)
      .populate("submittedBy", "name email profilePic")
      .populate("assignedAdminId", "name email")
      .sort({ submittedAt: 1, createdAt: -1 }).skip(skip).limit(limit),
    DocumentarySubmission.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Documentary submissions retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const getById = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null })
    .populate("submittedBy", "name email profilePic")
    .populate("assignedAdminId", "name email")
    .populate("mediaIds", "secureUrl url originalName fileType visibility moderationStatus")
    .populate("locationId", "name nameBn type")
    .populate("eventId", "title titleBn slug eventDate")
    .populate("tagIds", "name nameBn slug");
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  requireOwnerOrAdmin(req, submission, ["submittedBy"]);
  return sendSuccess(res, { message: "Documentary submission retrieved successfully.", data: submission });
});

const update = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  requireOwnerOrAdmin(req, submission, ["submittedBy"]);
  if (!isAdmin(req) && !["DRAFT", "NEEDS_INFORMATION"].includes(submission.status)) {
    throw new AppError("Only draft submissions or submissions awaiting information can be edited by the contributor.", 422, "SUBMISSION_NOT_EDITABLE");
  }
  const before = submission.toObject();
  const updates = pick(req.body, editableFields);
  const prospective = { ...submission.toObject(), ...updates };
  await validateSubmissionRules(prospective);
  if (Object.prototype.hasOwnProperty.call(updates, "mediaIds")) {
    await assertMediaAccessible(updates.mediaIds || [], { userId: req.userId, admin: isAdmin(req), allowPublic: true });
  }
  const consentChanged = Object.prototype.hasOwnProperty.call(updates, "publicationConsent")
    && updates.publicationConsent !== submission.publicationConsent;
  if (Object.prototype.hasOwnProperty.call(updates, "publicationConsent")) {
    updates.publicationConsentAt = updates.publicationConsent ? new Date() : null;
  }
  Object.assign(submission, updates);
  await submission.save();
  if (consentChanged) await recordPublicationConsent(req, submission, Boolean(updates.publicationConsent));
  await writeAudit(req, { action: "UPDATE", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, before, after: submission.toObject() });
  return sendSuccess(res, { message: "Documentary submission updated successfully.", data: submission });
});

const submitForReview = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  requireOwnerOrAdmin(req, submission, ["submittedBy"]);
  assertTransition("DOCUMENTARY_SUBMISSION", submission.status, "SUBMITTED");
  await assertSubmissionReady(submission.toObject(), req);
  await ensureConversation(submission, submission.submittedBy);
  submission.status = "SUBMITTED";
  submission.submittedAt = new Date();
  await submission.save();
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, after: { status: submission.status } });
  return sendSuccess(res, { message: "Documentary submission sent for admin review.", data: submission });
});

const assignAdmin = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  const adminId = req.body.adminId || req.userId;
  const admin = await User.findOne({ _id: adminId, role: "ADMIN", accountStatus: "ACTIVE", deletedAt: null });
  if (!admin) throw new AppError("The selected administrator is unavailable.", 422, "INVALID_ADMIN");
  submission.assignedAdminId = admin._id;
  if (submission.status === "SUBMITTED") submission.status = "UNDER_REVIEW";
  await submission.save();
  if (submission.conversationId) {
    await Conversation.findByIdAndUpdate(submission.conversationId, { assignedAdminId: submission.assignedAdminId, status: "OPEN" });
    await ConversationParticipant.findOneAndUpdate(
      { conversationId: submission.conversationId, userId: submission.assignedAdminId },
      {
        participantRole: "ADMIN", invitationStatus: "ACCEPTED", joinedAt: new Date(),
        permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: true, canChangeStatus: true, canViewSensitiveFiles: true },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  await writeAudit(req, { action: "UPDATE", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, after: { assignedAdminId: submission.assignedAdminId, status: submission.status } });
  return sendSuccess(res, { message: "Submission assigned successfully.", data: submission });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  assertTransition("DOCUMENTARY_SUBMISSION", submission.status, status);
  const before = submission.toObject();
  submission.status = status;
  if (status === "VERIFIED") submission.verifiedAt = new Date();
  if (status === "PUBLISHED") submission.publishedAt = new Date();
  if (status === "REJECTED") {
    if (!rejectionReason?.trim()) throw new AppError("A clear rejection reason is required.", 422, "REJECTION_REASON_REQUIRED");
    submission.rejectionReason = rejectionReason.trim();
  } else if (status !== "REJECTED") {
    submission.rejectionReason = null;
  }
  await submission.save();

  const notificationType = status === "VERIFIED" || status === "PUBLISHED" ? "SUBMISSION_APPROVED" : status === "REJECTED" ? "SUBMISSION_REJECTED" : "STATUS_CHANGED";
  await createNotification({
    userId: submission.submittedBy,
    type: notificationType,
    title: "Documentary submission updated",
    message: `Submission ${submission.submissionNumber} is now ${status}.`,
    entityType: "DOCUMENTARY_SUBMISSION",
    entityId: submission._id,
  });
  await writeAudit(req, { action: status === "VERIFIED" ? "VERIFY" : status === "REJECTED" ? "REJECT" : "CHANGE_STATUS", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, before, after: submission.toObject() });
  return sendSuccess(res, { message: `Submission status changed to ${status}.`, data: submission });
});

const remove = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  requireOwnerOrAdmin(req, submission, ["submittedBy"]);
  if (!isAdmin(req) && !["DRAFT", "ARCHIVED"].includes(submission.status)) {
    throw new AppError("A submitted record cannot be deleted by the contributor. Ask an admin to archive it.", 422, "SUBMISSION_DELETE_BLOCKED");
  }
  submission.deletedAt = new Date();
  await submission.save({ validateBeforeSave: false });
  await writeAudit(req, { action: "DELETE", targetType: "DOCUMENTARY_SUBMISSION", targetId: submission._id, before: submission.toObject() });
  return sendSuccess(res, { message: "Documentary submission deleted successfully.", data: null });
});

module.exports = { create, listMine, listAdmin, getById, update, submitForReview, assignAdmin, changeStatus, remove };
