const SupportCase = require("../models/supportCaseModel");
const SupportCasePrivateDetail = require("../models/supportCasePrivateDetailModel");
const SupportCaseStatusHistory = require("../models/supportCaseStatusHistoryModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Message = require("../models/messageModel");
const MediaAsset = require("../models/mediaAssetModel");
const VerificationReview = require("../models/verificationReviewModel");
const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { generatePublicNumber } = require("../helpers/identifiers");
const { saveUploadedFile, saveUploadedFiles } = require("../helpers/frontendUpload");
const {
  asBoolean,
  formatTime,
  mediaToFrontend,
  supportStatus,
  supportPriority,
  supportCategory,
  normalizeSupportRelationship,
  normalizeSupportType,
  normalizeInjuryLevel,
  priorityFromInjury,
  isObjectId,
} = require("../helpers/frontendCompatibility");

function caseFilter(id) {
  if (isObjectId(id)) return { $or: [{ _id: id }, { caseNumber: id }] };
  return { caseNumber: id };
}

async function findCase(id) {
  let supportCase = await SupportCase.findOne({ ...caseFilter(id), deletedAt: null });
  if (!supportCase) {
    const conversation = await Conversation.findOne({ conversationNumber: id, type: "SUPPORT_ROOM" });
    if (conversation) supportCase = await SupportCase.findOne({ conversationId: conversation._id, deletedAt: null });
  }
  return supportCase;
}

function assertCaseAccess(req, supportCase) {
  const admin = req.user?.role === "ADMIN";
  if (!admin && String(supportCase.createdBy) !== String(req.userId)) {
    throw new AppError("You do not have permission to access this support room.", 403, "SUPPORT_ROOM_FORBIDDEN");
  }
}

function serializeRoom(supportCase) {
  const admins = supportCase.assignedAdminIds || [];
  const assignedAdmin = admins[0]?.name || admins[0]?.email || "Awaiting assignment";
  return {
    id: supportCase.caseNumber || String(supportCase._id),
    _id: String(supportCase._id),
    title: supportCase.title,
    status: supportStatus(supportCase.status),
    priority: supportPriority(supportCase.priority, supportCase.injuryLevel),
    category: supportCategory(supportCase.supportTypes),
    updatedAt: formatTime(supportCase.updatedAt),
    assignedAdmin,
    unread: 0,
  };
}


function serializeSupportDocument(document) {
  const status =
    {
      APPROVED: "Verified",
      REJECTED: "Rejected",
      PENDING: "Pending verification",
    }[document.moderationStatus] || "Pending verification";
  return {
    ...mediaToFrontend(document, status),
    uploadedAt: formatTime(document.createdAt),
  };
}

function serializeMessage(message) {
  const sender = message.senderId || {};
  const media = Array.isArray(message.mediaIds) ? message.mediaIds[0] : null;
  return {
    id: String(message._id),
    sender: sender.role === "ADMIN" ? "admin" : "user",
    name: sender.name || (sender.role === "ADMIN" ? "Administrator" : "User"),
    text: message.body || "",
    time: formatTime(message.createdAt),
    attachment: media ? mediaToFrontend(media) : null,
  };
}

const createRequest = asyncHandler(async (req, res) => {
  const {
    requesterName,
    relationship,
    category,
    urgency,
    location,
    hospital,
    description,
    contact,
  } = req.body;

  if (!requesterName?.trim()) throw new AppError("Requester name is required.", 422, "REQUESTER_NAME_REQUIRED");
  if (!relationship?.trim()) throw new AppError("Relationship is required.", 422, "RELATIONSHIP_REQUIRED");
  if (!category?.trim()) throw new AppError("Support category is required.", 422, "SUPPORT_CATEGORY_REQUIRED");
  if (!description?.trim()) throw new AppError("A short support description is required.", 422, "SUPPORT_DESCRIPTION_REQUIRED");
  if (!contact?.trim()) throw new AppError("A private contact number is required.", 422, "CONTACT_REQUIRED");
  if (!asBoolean(req.body.consent)) {
    throw new AppError("Consent is required to create a private support request.", 422, "SUPPORT_CONSENT_REQUIRED");
  }

  const mediaAssets = await saveUploadedFiles(req.files || [], {
    userId: req.userId,
    folder: "july-smriti/support-documents",
    visibility: "PRIVATE",
  });
  const injuryLevel = normalizeInjuryLevel(urgency);
  const caseNumber = generatePublicNumber("JS-HELP");

  const supportCase = await SupportCase.create({
    caseNumber,
    createdBy: req.userId,
    injuredPersonUserId: normalizeSupportRelationship(relationship) === "SELF" ? req.userId : null,
    requestRelationship: normalizeSupportRelationship(relationship),
    supportTypes: [normalizeSupportType(category)],
    injuryLevel,
    title: `${category.trim()} support request`,
    summary: description.trim(),
    priority: priorityFromInjury(injuryLevel),
    status: "NEW",
    submittedAt: new Date(),
  });

  await SupportCasePrivateDetail.create({
    supportCaseId: supportCase._id,
    injuredPerson: {
      fullName: requesterName.trim(),
      phone: contact.trim(),
      address: location?.trim() || null,
    },
    injuryDetails: {
      injuryLocation: location?.trim() || null,
      injuryDescription: description.trim(),
      currentCondition: urgency?.trim() || null,
      hospitalName: hospital?.trim() || null,
    },
    medicalMediaIds: mediaAssets.map((asset) => asset._id),
    identityMediaIds: [],
  });

  const conversation = await Conversation.create({
    conversationNumber: generatePublicNumber("ROOM"),
    type: "SUPPORT_ROOM",
    subjectType: "SUPPORT_CASE",
    subjectId: supportCase._id,
    title: supportCase.title,
    createdBy: req.userId,
    status: "OPEN",
    lastMessageAt: new Date(),
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
  supportCase.conversationId = conversation._id;
  await supportCase.save({ validateBeforeSave: false });

  await SupportCaseStatusHistory.create({
    supportCaseId: supportCase._id,
    previousStatus: null,
    newStatus: "NEW",
    changedBy: req.userId,
    publicNote: "Support request submitted.",
  });
  await Consent.create({
    userId: req.userId,
    targetType: "SUPPORT_CASE",
    targetId: supportCase._id,
    consentType: "MEDICAL_DATA_PROCESSING",
    granted: true,
    consentTextVersion: process.env.CONSENT_TEXT_VERSION || "frontend-v1",
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    grantedAt: new Date(),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Your private support request was created successfully.",
    data: { ...serializeRoom(supportCase), id: caseNumber },
  });
});

const listRooms = asyncHandler(async (req, res) => {
  const items = await SupportCase.find({ createdBy: req.userId, deletedAt: null })
    .populate("assignedAdminIds", "name email")
    .sort({ updatedAt: -1 });
  return sendSuccess(res, {
    message: "Your support rooms were retrieved successfully.",
    data: items.map(serializeRoom),
  });
});

async function loadMessages(conversationId) {
  if (!conversationId) return [];
  return Message.find({ conversationId, deletedAt: null, visibility: "ALL_PARTICIPANTS" })
    .populate("senderId", "name role")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus")
    .sort({ createdAt: 1 });
}

const getRoom = asyncHandler(async (req, res) => {
  const supportCase = await findCase(req.params.roomId);
  if (!supportCase) throw new AppError("The requested support room was not found.", 404, "SUPPORT_ROOM_NOT_FOUND");
  assertCaseAccess(req, supportCase);
  await supportCase.populate("assignedAdminIds", "name email");
  const messages = await loadMessages(supportCase.conversationId);
  return sendSuccess(res, {
    message: "Support room retrieved successfully.",
    data: { room: serializeRoom(supportCase), messages: messages.map(serializeMessage) },
  });
});

async function addMessage(req, supportCase) {
  assertCaseAccess(req, supportCase);
  const body = req.body.message?.trim() || "";
  if (!body && !req.file) throw new AppError("Write a message or attach a file.", 422, "MESSAGE_CONTENT_REQUIRED");

  let media = null;
  if (req.file) {
    media = await saveUploadedFile(req.file, {
      userId: req.userId,
      folder: "july-smriti/support-messages",
      visibility: "PRIVATE",
    });
  }

  const messageType = media
    ? media.fileType === "IMAGE"
      ? "IMAGE"
      : "FILE"
    : "TEXT";
  const message = await Message.create({
    clientMessageId: req.body.clientMessageId || generatePublicNumber("MSG"),
    conversationId: supportCase.conversationId,
    senderId: req.userId,
    messageType,
    body,
    mediaIds: media ? [media._id] : [],
    visibility: "ALL_PARTICIPANTS",
  });
  await Conversation.findByIdAndUpdate(supportCase.conversationId, {
    lastMessageAt: new Date(),
    status: req.user?.role === "ADMIN" ? "WAITING_FOR_USER" : "WAITING_FOR_ADMIN",
  });
  supportCase.updatedAt = new Date();
  await supportCase.save({ validateBeforeSave: false });

  const populated = await Message.findById(message._id)
    .populate("senderId", "name role")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus");
  const serialized = serializeMessage(populated);
  return { message: serialized, attachment: serialized.attachment };
}

const sendRoomMessage = asyncHandler(async (req, res) => {
  const supportCase = await findCase(req.params.roomId);
  if (!supportCase) throw new AppError("The requested support room was not found.", 404, "SUPPORT_ROOM_NOT_FOUND");
  const data = await addMessage(req, supportCase);
  return sendSuccess(res, { statusCode: 201, message: "Message sent successfully.", data });
});

const listAdmin = asyncHandler(async (_req, res) => {
  const items = await SupportCase.find({ deletedAt: null })
    .populate("createdBy", "name email phone")
    .populate("assignedAdminIds", "name email")
    .sort({ priority: -1, updatedAt: -1 });

  const data = [];
  for (const supportCase of items) {
    const details = await SupportCasePrivateDetail.findOne({ supportCaseId: supportCase._id })
      .select("+injuredPerson +injuryDetails +medicalMediaIds");
    const documents = details?.medicalMediaIds?.length
      ? await MediaAsset.find({ _id: { $in: details.medicalMediaIds }, deletedAt: null })
      : [];
    data.push({
      ...serializeRoom(supportCase),
      requester: details?.injuredPerson?.fullName || supportCase.createdBy?.name || "Requester",
      location: details?.injuryDetails?.injuryLocation || "Not specified",
      hospital: details?.injuryDetails?.hospitalName || "Not specified",
      summary: supportCase.summary,
      documents: documents.map(serializeSupportDocument),
    });
  }

  return sendSuccess(res, { message: "Support cases retrieved successfully.", data });
});

const getAdminCase = asyncHandler(async (req, res) => {
  const supportCase = await findCase(req.params.id);
  if (!supportCase) throw new AppError("The requested support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  await supportCase.populate("createdBy", "name email phone");
  await supportCase.populate("assignedAdminIds", "name email");

  const details = await SupportCasePrivateDetail.findOne({ supportCaseId: supportCase._id })
    .select("+injuredPerson +injuryDetails +emergencyContact +medicalMediaIds +identityMediaIds");
  const documents = details?.medicalMediaIds?.length
    ? await MediaAsset.find({ _id: { $in: details.medicalMediaIds }, deletedAt: null })
    : [];
  const messages = await loadMessages(supportCase.conversationId);
  const history = await SupportCaseStatusHistory.find({ supportCaseId: supportCase._id }).sort({ createdAt: 1 });

  const data = {
    ...serializeRoom(supportCase),
    requester: details?.injuredPerson?.fullName || supportCase.createdBy?.name || "Requester",
    location: details?.injuryDetails?.injuryLocation || details?.injuredPerson?.address || "Not specified",
    hospital: details?.injuryDetails?.hospitalName || "Not specified",
    summary: supportCase.summary,
    contact: details?.injuredPerson?.phone || supportCase.createdBy?.phone || "Protected",
    documents: documents.map(serializeSupportDocument),
    messages: messages.map(serializeMessage),
    progress: history.length
      ? history.map((entry) => entry.publicNote || supportStatus(entry.newStatus))
      : ["Support request submitted"],
  };

  return sendSuccess(res, { message: "Support case retrieved successfully.", data });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const supportCase = await findCase(req.params.id);
  if (!supportCase) throw new AppError("The requested support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  const previousStatus = supportCase.status;
  if (supportCase.status === "NEW") supportCase.status = "UNDER_REVIEW";
  const data = await addMessage(req, supportCase);
  if (previousStatus !== supportCase.status) {
    await SupportCaseStatusHistory.create({
      supportCaseId: supportCase._id,
      previousStatus,
      newStatus: supportCase.status,
      changedBy: req.userId,
      publicNote: "An administrator started reviewing the support request.",
    });
  }
  return sendSuccess(res, { statusCode: 201, message: "Admin reply sent successfully.", data });
});

const verifyDocument = asyncHandler(async (req, res) => {
  const supportCase = await findCase(req.params.caseId);
  if (!supportCase) throw new AppError("The requested support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  const media = await MediaAsset.findOne({ _id: req.params.documentId, deletedAt: null });
  if (!media) throw new AppError("The requested support document was not found.", 404, "SUPPORT_DOCUMENT_NOT_FOUND");

  const details = await SupportCasePrivateDetail.findOne({ supportCaseId: supportCase._id })
    .select("+medicalMediaIds");
  if (!details?.medicalMediaIds?.some((id) => String(id) === String(media._id))) {
    throw new AppError("This document does not belong to the selected support case.", 409, "DOCUMENT_CASE_MISMATCH");
  }

  const approved = String(req.body.status).toLowerCase() === "verified";
  media.moderationStatus = approved ? "APPROVED" : "REJECTED";
  await media.save();
  await VerificationReview.create({
    targetType: "MEDIA_ASSET",
    targetId: media._id,
    reviewedBy: req.userId,
    status: approved ? "VERIFIED" : "REJECTED",
    verificationChecks: [
      {
        checkType: "MEDICAL_DOCUMENT",
        status: approved ? "PASSED" : "FAILED",
        note: req.body.note || null,
      },
    ],
    adminComment: req.body.note || null,
    reviewedAt: new Date(),
  });

  const previousStatus = supportCase.status;
  if (approved && ["NEW", "UNDER_REVIEW", "VERIFICATION_PENDING"].includes(supportCase.status)) {
    const allDocuments = details.medicalMediaIds?.length
      ? await MediaAsset.find({ _id: { $in: details.medicalMediaIds }, deletedAt: null })
      : [];
    supportCase.status = allDocuments.length && allDocuments.every((item) => item.moderationStatus === "APPROVED")
      ? "VERIFIED"
      : "VERIFICATION_PENDING";
  } else if (!approved) {
    supportCase.status = "ACTION_REQUIRED";
  }
  if (previousStatus !== supportCase.status) {
    await supportCase.save({ validateBeforeSave: false });
    await SupportCaseStatusHistory.create({
      supportCaseId: supportCase._id,
      previousStatus,
      newStatus: supportCase.status,
      changedBy: req.userId,
      publicNote: approved
        ? "A submitted support document was reviewed."
        : "A submitted document needs replacement or clarification.",
    });
  }

  return sendSuccess(res, {
    message: approved ? "Support document verified successfully." : "Support document rejected.",
    data: mediaToFrontend(media),
  });
});

module.exports = {
  createRequest,
  listRooms,
  getRoom,
  sendRoomMessage,
  listAdmin,
  getAdminCase,
  sendAdminMessage,
  verifyDocument,
  serializeRoom,
  serializeMessage,
  findCase,
};
