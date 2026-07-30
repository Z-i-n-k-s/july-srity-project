const DocumentarySubmission = require("../models/documentarySubmissionModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { generatePublicNumber } = require("../helpers/identifiers");
const { saveUploadedFiles } = require("../helpers/frontendUpload");
const {
  asBoolean,
  parseJson,
  formatDate,
  formatTime,
  mediaToFrontend,
  submissionStatus,
  normalizeSourceType,
  normalizeSubmissionType,
  normalizeAnonymity,
  isObjectId,
} = require("../helpers/frontendCompatibility");

function serializeSubmission(item, { admin = false } = {}) {
  const user = item.submittedBy || {};
  const privacy = item.privacyControls || {};
  const media = item.mediaIds || [];
  const id = item.submissionNumber || String(item._id);

  const common = {
    id,
    _id: String(item._id),
    title: item.title,
    type: item.frontendType || item.submissionType,
    contentTypes: item.contentTypes?.length ? item.contentTypes : [item.submissionType],
    attachmentCount: media.length,
    identity:
      item.publicAttributionLabel ||
      item.identityPreferenceLabel ||
      ({ HIDE_NAME: "Anonymous contributor", SHOW_PSEUDONYM: "Pseudonym protected", SHOW_NAME: "Contributor name visible" }[
        item.anonymityPreference
      ] || "Identity setting recorded"),
    publicAttribution:
      item.publicAttributionLabel || item.identityPreferenceLabel || "Identity setting recorded",
    publicationPermission:
      item.publicationPermissionLabel ||
      (item.publicationConsent ? "Approved for publication after review" : "Ask me before any public publication"),
    visibility: item.status === "PUBLISHED" ? "Public version" : "Private",
    status:
      !admin && submissionStatus(item.status, item.reviewLabel) === "Pending review"
        ? "Pending admin review"
        : submissionStatus(item.status, item.reviewLabel),
    updatedAt: formatTime(item.updatedAt),
    createdAt: formatDate(item.createdAt),
  };

  if (!admin) return common;

  return {
    ...common,
    submittedBy: user.name || "Contributor",
    contact: user.email || user.phone || "Protected",
    identityPreference:
      item.identityPreferenceLabel || common.identity,
    risk:
      privacy.protectFaces || privacy.protectVoices || privacy.redactNames
        ? "Privacy processing required"
        : "Standard privacy review",
    submittedAt: formatTime(item.submittedAt || item.createdAt),
    eventDate: formatDate(item.eventDate),
    location: item.locationDescription || "Not specified",
    summary: item.description || "",
    storyText: item.storyContent || "",
    sourceType: item.sourceType,
    sourceNotes: item.sourceDescription || "",
    privacy: {
      removeMetadata: Boolean(privacy.removeMetadata),
      redactNames: Boolean(privacy.redactNames),
      protectFaces: Boolean(privacy.protectFaces),
      protectVoices: Boolean(privacy.protectVoices),
    },
    attachments: media.map((asset) => mediaToFrontend(asset)).filter(Boolean),
  };
}

function resolveFilter(id) {
  return isObjectId(id)
    ? { $or: [{ _id: id }, { submissionNumber: id }] }
    : { submissionNumber: id };
}

const createSubmission = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  if (!title) throw new AppError("A submission title is required.", 422, "TITLE_REQUIRED");

  const consent = asBoolean(req.body.consent);
  const accuracy = asBoolean(req.body.accuracy);
  const privacyConfirmed = asBoolean(req.body.privacyConfirmed);
  if (!consent) {
    throw new AppError("Private administrator review consent is required.", 422, "REVIEW_CONSENT_REQUIRED");
  }
  if (!accuracy) {
    throw new AppError("Confirm that the source information is accurate to the best of your knowledge.", 422, "ACCURACY_CONFIRMATION_REQUIRED");
  }
  if (!privacyConfirmed) {
    throw new AppError("Confirm the selected identity and privacy settings.", 422, "PRIVACY_CONFIRMATION_REQUIRED");
  }

  const files = req.files || [];
  const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
  if (totalBytes > 1024 * 1024 * 1024) {
    throw new AppError("The combined attachment size cannot exceed 1 GB.", 413, "TOTAL_UPLOAD_TOO_LARGE");
  }

  const contentTypes = parseJson(req.body.contentTypes, []);
  const submittedPrivacy = parseJson(req.body.privacyControls, {});
  const mediaAssets = await saveUploadedFiles(files, {
    userId: req.userId,
    folder: "july-smriti/submissions",
    visibility: "PRIVATE",
  });

  const publicationLabel = req.body.publicationPermission?.trim() || null;
  const publicationConsent = Boolean(
    publicationLabel && !publicationLabel.toLowerCase().includes("ask me") && !publicationLabel.toLowerCase().includes("do not")
  );
  const identityLabel = req.body.identityPreference?.trim() || "Anonymous to the public";

  const submission = await DocumentarySubmission.create({
    submissionNumber: generatePublicNumber("SUB"),
    submittedBy: req.userId,
    submissionType: normalizeSubmissionType(req.body.type, contentTypes),
    frontendType: req.body.type?.trim() || null,
    title,
    description: req.body.summary?.trim() || null,
    storyContent: req.body.storyText?.trim() || null,
    contentTypes: Array.isArray(contentTypes) ? contentTypes.map(String) : [],
    mediaIds: mediaAssets.map((asset) => asset._id),
    eventDate: req.body.eventDate || null,
    locationDescription: req.body.location?.trim() || null,
    sourceType: normalizeSourceType(req.body.sourceType),
    sourceDescription: req.body.sourceNotes?.trim() || null,
    isOriginalUploader: normalizeSourceType(req.body.sourceType) === "FIRST_HAND",
    anonymityPreference: normalizeAnonymity(identityLabel),
    identityPreferenceLabel: identityLabel,
    publicAttributionLabel:
      submittedPrivacy.publicAttribution?.trim() ||
      (normalizeAnonymity(identityLabel) === "HIDE_NAME"
        ? "Anonymous contributor"
        : normalizeAnonymity(identityLabel) === "SHOW_PSEUDONYM"
          ? req.body.pseudonym?.trim() || "Pseudonym pending"
          : "Contributor name visible"),
    pseudonym: req.body.pseudonym?.trim() || null,
    publicationConsent,
    publicationConsentAt: publicationConsent ? new Date() : null,
    publicationPermissionLabel: publicationLabel,
    archiveVisibility: req.body.archiveVisibility?.trim() || null,
    privacyControls: {
      removeMetadata: asBoolean(req.body.removeMetadata, asBoolean(submittedPrivacy.removeMetadata, true)),
      redactNames: asBoolean(req.body.redactNames, asBoolean(submittedPrivacy.redactNames)),
      protectFaces: asBoolean(req.body.protectFaces, asBoolean(submittedPrivacy.protectFaces)),
      protectVoices: asBoolean(req.body.protectVoices, asBoolean(submittedPrivacy.protectVoices)),
      allowAdminContact: asBoolean(req.body.allowAdminContact, asBoolean(submittedPrivacy.allowAdminContact, true)),
    },
    accuracyConfirmed: accuracy,
    privacyConfirmed,
    status: "SUBMITTED",
    reviewLabel: "Pending review",
    submittedAt: new Date(),
  });

  const conversation = await Conversation.create({
    conversationNumber: generatePublicNumber("CONV"),
    type: "DOCUMENTARY_REVIEW",
    subjectType: "DOCUMENTARY_SUBMISSION",
    subjectId: submission._id,
    title: `Review: ${submission.title}`,
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
  submission.conversationId = conversation._id;
  await submission.save({ validateBeforeSave: false });

  await Consent.create({
    userId: req.userId,
    targetType: "DOCUMENTARY_SUBMISSION",
    targetId: submission._id,
    consentType: "DATA_PROCESSING",
    granted: true,
    consentTextVersion: process.env.CONSENT_TEXT_VERSION || "frontend-v1",
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    grantedAt: new Date(),
  });

  const populated = await DocumentarySubmission.findById(submission._id)
    .populate("submittedBy", "name email phone")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus");

  return sendSuccess(res, {
    statusCode: 201,
    message: "Your record was submitted for private administrator review.",
    data: serializeSubmission(populated),
  });
});

const saveDraft = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim() || "Untitled draft";
  const contentTypes = parseJson(req.body.contentTypes, []);
  const submission = await DocumentarySubmission.create({
    submissionNumber: generatePublicNumber("SUB"),
    clientDraftId: req.body.clientDraftId || req.body.id || null,
    submittedBy: req.userId,
    submissionType: normalizeSubmissionType(req.body.type, contentTypes),
    frontendType: req.body.type?.trim() || null,
    title,
    description: req.body.summary || null,
    storyContent: req.body.storyText || null,
    contentTypes,
    eventDate: req.body.eventDate || null,
    locationDescription: req.body.location || null,
    sourceType: normalizeSourceType(req.body.sourceType),
    sourceDescription: req.body.sourceNotes || null,
    anonymityPreference: normalizeAnonymity(req.body.identityPreference),
    identityPreferenceLabel: req.body.identityPreference || null,
    publicAttributionLabel:
      parseJson(req.body.privacyControls, {})?.publicAttribution || null,
    publicationPermissionLabel: req.body.publicationPermission || null,
    archiveVisibility: req.body.archiveVisibility || null,
    status: "DRAFT",
    reviewLabel: "Draft",
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Submission draft saved successfully.",
    data: serializeSubmission(submission),
  });
});

const listMine = asyncHandler(async (req, res) => {
  const items = await DocumentarySubmission.find({ submittedBy: req.userId, deletedAt: null })
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus")
    .sort({ updatedAt: -1 });

  return sendSuccess(res, {
    message: "Your submissions were retrieved successfully.",
    data: items.map((item) => serializeSubmission(item)),
  });
});

const getMine = asyncHandler(async (req, res) => {
  const item = await DocumentarySubmission.findOne({
    ...resolveFilter(req.params.id),
    submittedBy: req.userId,
    deletedAt: null,
  })
    .populate("submittedBy", "name email phone")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus");
  if (!item) throw new AppError("The requested submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  return sendSuccess(res, { message: "Submission retrieved successfully.", data: serializeSubmission(item) });
});

module.exports = {
  createSubmission,
  saveDraft,
  listMine,
  getMine,
  serializeSubmission,
  resolveFilter,
};
