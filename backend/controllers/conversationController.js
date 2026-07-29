const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Message = require("../models/messageModel");
const MessageReceipt = require("../models/messageReceiptModel");
const DocumentRequest = require("../models/documentRequestModel");
const User = require("../models/userModel");
const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { generatePublicNumber } = require("../helpers/identifiers");
const { canAccessConversation, isAdmin } = require("../helpers/access");
const { assertTransition } = require("../helpers/statusTransitions");
const { createNotification, writeAudit } = require("../helpers/activity");
const { assertMediaAccessible } = require("../helpers/mediaValidation");

async function recipientIds(conversation, senderId) {
  const ids = new Set();
  ids.add(String(conversation.createdBy));
  if (conversation.assignedAdminId) ids.add(String(conversation.assignedAdminId));
  const participants = await ConversationParticipant.find({
    conversationId: conversation._id,
    invitationStatus: "ACCEPTED",
    removedAt: null,
  }).select("userId");
  for (const participant of participants) ids.add(String(participant.userId));
  ids.delete(String(senderId));
  return [...ids];
}

const createGeneral = asyncHandler(async (req, res) => {
  const conversation = await Conversation.create({
    conversationNumber: generatePublicNumber("CONV"),
    type: "GENERAL_ENQUIRY",
    subjectType: "NONE",
    subjectId: null,
    title: req.body.title || "General enquiry",
    createdBy: req.userId,
    status: "OPEN",
  });
  await ConversationParticipant.create({
    conversationId: conversation._id,
    userId: req.userId,
    participantRole: "OWNER",
    invitationStatus: "ACCEPTED",
    joinedAt: new Date(),
    permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: false, canChangeStatus: false, canViewSensitiveFiles: true },
  });
  if (req.body.message?.trim()) {
    await Message.create({
      clientMessageId: req.body.clientMessageId || generatePublicNumber("MSG"),
      conversationId: conversation._id,
      senderId: req.userId,
      messageType: "TEXT",
      body: req.body.message.trim(),
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();
  }
  return sendSuccess(res, { statusCode: 201, message: "General enquiry conversation created successfully.", data: conversation });
});

const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const memberships = await ConversationParticipant.find({ userId: req.userId, invitationStatus: "ACCEPTED", removedAt: null }).select("conversationId");
  const ids = memberships.map((item) => item.conversationId);
  const filter = {
    $or: [{ createdBy: req.userId }, { assignedAdminId: req.userId }, { _id: { $in: ids } }],
  };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;
  const [items, total] = await Promise.all([
    Conversation.find(filter).populate("createdBy assignedAdminId", "name email role").sort({ lastMessageAt: -1, updatedAt: -1 }).skip(skip).limit(limit),
    Conversation.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Conversations retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const field of ["status", "type", "subjectType", "assignedAdminId", "createdBy"]) if (req.query[field]) filter[field] = req.query[field];
  const [items, total] = await Promise.all([
    Conversation.find(filter).populate("createdBy assignedAdminId", "name email role").sort({ lastMessageAt: -1, createdAt: -1 }).skip(skip).limit(limit),
    Conversation.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "All conversations retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const getById = asyncHandler(async (req, res) => {
  const { conversation } = await canAccessConversation(req, req.params.conversationId);
  await conversation.populate("createdBy assignedAdminId", "name email role profilePic");
  const participants = await ConversationParticipant.find({ conversationId: conversation._id, removedAt: null })
    .populate("userId", "name email role profilePic")
    .populate("invitedBy", "name email");
  return sendSuccess(res, { message: "Conversation retrieved successfully.", data: { conversation, participants } });
});

const assignAdmin = asyncHandler(async (req, res) => {
  const adminId = req.body.adminId || req.userId;
  const admin = await User.findOne({ _id: adminId, role: "ADMIN", accountStatus: "ACTIVE", deletedAt: null });
  if (!admin) throw new AppError("The selected administrator is unavailable.", 422, "INVALID_ADMIN");
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) throw new AppError("Conversation was not found.", 404, "CONVERSATION_NOT_FOUND");
  conversation.assignedAdminId = admin._id;
  if (conversation.status === "WAITING_FOR_ADMIN") conversation.status = "OPEN";
  await conversation.save();
  await ConversationParticipant.findOneAndUpdate(
    { conversationId: conversation._id, userId: admin._id },
    {
      participantRole: "ADMIN", invitationStatus: "ACCEPTED", joinedAt: new Date(), removedAt: null,
      permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: true, canChangeStatus: true, canViewSensitiveFiles: true },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await writeAudit(req, { action: "UPDATE", targetType: "CONVERSATION", targetId: conversation._id, after: { assignedAdminId: admin._id } });
  return sendSuccess(res, { message: "Conversation assigned successfully.", data: conversation });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId, "canChangeStatus");
  if (!isAdmin(req) && participant?.permissions?.canChangeStatus !== true && String(conversation.createdBy) !== String(req.userId)) {
    throw new AppError("You cannot change this conversation status.", 403, "FORBIDDEN");
  }
  assertTransition("CONVERSATION", conversation.status, req.body.status);
  const before = conversation.toObject();
  conversation.status = req.body.status;
  await conversation.save();
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "CONVERSATION", targetId: conversation._id, before, after: conversation.toObject() });
  return sendSuccess(res, { message: `Conversation status changed to ${conversation.status}.`, data: conversation });
});

const inviteParticipant = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId, "canInviteParticipants");
  const permitted = isAdmin(req) || String(conversation.createdBy) === String(req.userId) || participant?.permissions?.canInviteParticipants;
  if (!permitted) throw new AppError("You cannot invite participants to this conversation.", 403, "FORBIDDEN");
  const user = await User.findOne({ _id: req.body.userId, accountStatus: "ACTIVE", deletedAt: null });
  if (!user) throw new AppError("The invited user was not found or is unavailable.", 404, "INVITED_USER_NOT_FOUND");

  const participantRole = user.role === "ADMIN" ? "ADMIN" : (req.body.participantRole || "TRUSTED_PARTICIPANT");
  if (participantRole === "ADMIN" && user.role !== "ADMIN") {
    throw new AppError("Only a platform administrator can receive the ADMIN participant role.", 422, "INVALID_PARTICIPANT_ROLE");
  }
  const requestedPermissions = { ...(req.body.permissions || {}) };
  if (!isAdmin(req)) {
    requestedPermissions.canInviteParticipants = false;
    requestedPermissions.canChangeStatus = false;
  }
  if (requestedPermissions.canViewSensitiveFiles && user.role !== "ADMIN") {
    if (conversation.subjectType === "NONE") {
      throw new AppError("Sensitive-file access is only available for a case-linked conversation.", 422, "SENSITIVE_ACCESS_NOT_APPLICABLE");
    }
    const latestConsent = await Consent.findOne({
      userId: conversation.createdBy,
      targetType: conversation.subjectType,
      targetId: conversation.subjectId,
      consentType: "FAMILY_PARTICIPANT_ACCESS",
    }).sort({ createdAt: -1 });
    if (!latestConsent?.granted) {
      throw new AppError("The case owner must grant FAMILY_PARTICIPANT_ACCESS consent before sensitive-file access can be shared.", 403, "SENSITIVE_ACCESS_CONSENT_REQUIRED");
    }
  }

  const invited = await ConversationParticipant.findOneAndUpdate(
    { conversationId: conversation._id, userId: user._id },
    {
      participantRole,
      permissions: requestedPermissions,
      invitedBy: req.userId,
      invitationStatus: user.role === "ADMIN" ? "ACCEPTED" : "PENDING",
      joinedAt: user.role === "ADMIN" ? new Date() : null,
      removedAt: null,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await writeAudit(req, { action: "ADD_PARTICIPANT", targetType: "CONVERSATION", targetId: conversation._id, after: { userId: user._id } });
  return sendSuccess(res, { statusCode: 201, message: "Conversation invitation created successfully.", data: invited });
});

const respondToInvitation = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!['ACCEPTED', 'REJECTED'].includes(status)) throw new AppError("Invitation response must be ACCEPTED or REJECTED.", 422, "INVALID_INVITATION_RESPONSE");
  const participant = await ConversationParticipant.findOne({
    conversationId: req.params.conversationId,
    userId: req.userId,
    invitationStatus: "PENDING",
  });
  if (!participant) throw new AppError("A pending invitation was not found.", 404, "INVITATION_NOT_FOUND");
  participant.invitationStatus = status;
  participant.joinedAt = status === "ACCEPTED" ? new Date() : null;
  await participant.save();
  return sendSuccess(res, { message: `Conversation invitation ${status.toLowerCase()}.`, data: participant });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId, "canInviteParticipants");
  if (!isAdmin(req) && String(conversation.createdBy) !== String(req.userId) && !participant?.permissions?.canInviteParticipants) {
    throw new AppError("You cannot remove participants from this conversation.", 403, "FORBIDDEN");
  }
  if (String(conversation.createdBy) === String(req.params.userId)) throw new AppError("The conversation owner cannot be removed.", 422, "OWNER_REMOVAL_BLOCKED");
  const removed = await ConversationParticipant.findOneAndUpdate(
    { conversationId: conversation._id, userId: req.params.userId, removedAt: null },
    { invitationStatus: "REMOVED", removedAt: new Date() },
    { new: true }
  );
  if (!removed) throw new AppError("Active conversation participant was not found.", 404, "PARTICIPANT_NOT_FOUND");
  await writeAudit(req, { action: "REMOVE_PARTICIPANT", targetType: "CONVERSATION", targetId: conversation._id, after: { userId: req.params.userId } });
  return sendSuccess(res, { message: "Participant removed successfully.", data: null });
});

const listMessages = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const filter = { conversationId: req.params.conversationId, deletedAt: null };
  if (!isAdmin(req)) filter.visibility = "ALL_PARTICIPANTS";
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
  const messages = await Message.find(filter)
    .populate("senderId", "name role profilePic")
    .populate("mediaIds", "secureUrl url originalName fileType mimeType visibility")
    .populate("replyToMessageId", "body senderId messageType")
    .sort({ createdAt: -1 }).limit(limit);
  const canViewSensitive = isAdmin(req) || String(conversation.createdBy) === String(req.userId) || participant?.permissions?.canViewSensitiveFiles === true;
  const ordered = messages.reverse().map((document) => {
    const message = document.toObject();
    message.mediaIds = (message.mediaIds || []).map((media) => {
      if (canViewSensitive || media.visibility === "PUBLIC") return media;
      const safe = { ...media };
      delete safe.url;
      delete safe.secureUrl;
      safe.accessRestricted = true;
      return safe;
    });
    return message;
  });
  return sendSuccess(res, {
    message: "Messages retrieved successfully.",
    data: ordered,
    meta: { limit, nextBefore: ordered.length === limit ? ordered[0]?.createdAt : null },
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId, "canSendMessages");
  if (["RESOLVED", "CLOSED"].includes(conversation.status)) throw new AppError("Reopen the conversation before sending a new message.", 422, "CONVERSATION_NOT_OPEN");
  if (!isAdmin(req) && participant && participant.permissions?.canSendMessages !== true) throw new AppError("You cannot send messages in this conversation.", 403, "FORBIDDEN");
  if (req.body.visibility === "ADMIN_ONLY" && !isAdmin(req)) throw new AppError("Only administrators can send admin-only messages.", 403, "FORBIDDEN");

  const messageType = req.body.messageType || "TEXT";
  const mediaIds = Array.isArray(req.body.mediaIds) ? req.body.mediaIds : [];
  if (["TEXT", "SYSTEM_UPDATE", "STATUS_UPDATE", "DOCUMENT_REQUEST"].includes(messageType) && !req.body.body?.trim()) {
    throw new AppError("A message body is required for this message type.", 422, "MESSAGE_BODY_REQUIRED");
  }
  if (["FILE", "IMAGE", "VIDEO"].includes(messageType) && mediaIds.length === 0) {
    throw new AppError("At least one media ID is required for a file message.", 422, "MESSAGE_MEDIA_REQUIRED");
  }
  await assertMediaAccessible(mediaIds, { userId: req.userId, admin: isAdmin(req), allowPublic: true });
  if (req.body.replyToMessageId) {
    const replyExists = await Message.exists({ _id: req.body.replyToMessageId, conversationId: conversation._id, deletedAt: null });
    if (!replyExists) throw new AppError("The replied-to message does not belong to this conversation.", 422, "INVALID_REPLY_TARGET");
  }

  const message = await Message.create({
    clientMessageId: req.body.clientMessageId || generatePublicNumber("MSG"),
    conversationId: conversation._id,
    senderId: req.userId,
    messageType,
    body: req.body.body?.trim() || "",
    mediaIds,
    replyToMessageId: req.body.replyToMessageId || null,
    visibility: req.body.visibility || "ALL_PARTICIPANTS",
  });
  conversation.lastMessageAt = message.createdAt;
  conversation.status = isAdmin(req) ? "WAITING_FOR_USER" : "WAITING_FOR_ADMIN";
  await conversation.save();

  const recipients = await recipientIds(conversation, req.userId);
  if (message.visibility === "ALL_PARTICIPANTS") {
    await Promise.all(recipients.map((userId) => createNotification({
      userId,
      type: "NEW_MESSAGE",
      title: "New conversation message",
      message: message.body?.slice(0, 180) || `A ${message.messageType.toLowerCase()} was sent.`,
      entityType: "CONVERSATION",
      entityId: conversation._id,
    })));
  }

  await message.populate("senderId", "name role profilePic");
  return sendSuccess(res, { statusCode: 201, message: "Message sent successfully.", data: message });
});

const editMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, conversationId: req.params.conversationId, deletedAt: null });
  if (!message) throw new AppError("Message was not found.", 404, "MESSAGE_NOT_FOUND");
  await canAccessConversation(req, req.params.conversationId);
  if (!isAdmin(req) && String(message.senderId) !== String(req.userId)) throw new AppError("You can only edit your own messages.", 403, "FORBIDDEN");
  if (message.messageType !== "TEXT") throw new AppError("Only text messages can be edited.", 422, "MESSAGE_NOT_EDITABLE");
  if (!req.body.body?.trim()) throw new AppError("Message body cannot be empty.", 422, "MESSAGE_BODY_REQUIRED");
  message.body = req.body.body.trim();
  message.editedAt = new Date();
  await message.save();
  return sendSuccess(res, { message: "Message updated successfully.", data: message });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.messageId, conversationId: req.params.conversationId, deletedAt: null });
  if (!message) throw new AppError("Message was not found.", 404, "MESSAGE_NOT_FOUND");
  await canAccessConversation(req, req.params.conversationId);
  if (!isAdmin(req) && String(message.senderId) !== String(req.userId)) throw new AppError("You can only delete your own messages.", 403, "FORBIDDEN");
  message.deletedAt = new Date();
  message.body = "[Message deleted]";
  await message.save({ validateBeforeSave: false });
  return sendSuccess(res, { message: "Message deleted successfully.", data: null });
});

const markMessageRead = asyncHandler(async (req, res) => {
  await canAccessConversation(req, req.params.conversationId);
  const message = await Message.findOne({ _id: req.params.messageId, conversationId: req.params.conversationId });
  if (!message) throw new AppError("Message was not found.", 404, "MESSAGE_NOT_FOUND");
  const receipt = await MessageReceipt.findOneAndUpdate(
    { messageId: message._id, userId: req.userId },
    { $set: { deliveredAt: new Date(), readAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return sendSuccess(res, { message: "Message marked as read.", data: receipt });
});

const createDocumentRequest = asyncHandler(async (req, res) => {
  const { conversation } = await canAccessConversation(req, req.params.conversationId);
  if (!isAdmin(req)) throw new AppError("Only administrators can request documents.", 403, "FORBIDDEN");
  if (conversation.subjectType === "NONE" || conversation.subjectType !== req.body.targetType || String(conversation.subjectId) !== String(req.body.targetId)) {
    throw new AppError("The document request target must match the conversation subject.", 422, "DOCUMENT_REQUEST_TARGET_MISMATCH");
  }
  const request = await DocumentRequest.create({
    conversationId: conversation._id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    requestedBy: req.userId,
    ...pick(req.body, ["documentType", "title", "instructions", "required", "dueAt"]),
    status: "REQUESTED",
  });
  await Message.create({
    clientMessageId: generatePublicNumber("SYS"),
    conversationId: conversation._id,
    senderId: req.userId,
    messageType: "DOCUMENT_REQUEST",
    body: `Document requested: ${request.title}`,
    visibility: "ALL_PARTICIPANTS",
  });
  await createNotification({
    userId: conversation.createdBy,
    type: "DOCUMENT_REQUESTED",
    title: "A document was requested",
    message: request.title,
    entityType: "CONVERSATION",
    entityId: conversation._id,
  });
  return sendSuccess(res, { statusCode: 201, message: "Document request created successfully.", data: request });
});

const listDocumentRequests = asyncHandler(async (req, res) => {
  const { conversation, participant } = await canAccessConversation(req, req.params.conversationId);
  const requests = await DocumentRequest.find({ conversationId: req.params.conversationId })
    .populate("requestedBy", "name role")
    .populate("submittedMediaIds", "secureUrl url originalName fileType visibility")
    .sort({ createdAt: -1 });
  const canViewSensitive = isAdmin(req) || String(conversation.createdBy) === String(req.userId) || participant?.permissions?.canViewSensitiveFiles === true;
  const safeRequests = requests.map((document) => {
    const request = document.toObject();
    request.submittedMediaIds = (request.submittedMediaIds || []).map((media) => {
      if (canViewSensitive || media.visibility === "PUBLIC") return media;
      const safe = { ...media };
      delete safe.url;
      delete safe.secureUrl;
      safe.accessRestricted = true;
      return safe;
    });
    return request;
  });
  return sendSuccess(res, { message: "Document requests retrieved successfully.", data: safeRequests });
});

const submitDocumentRequest = asyncHandler(async (req, res) => {
  await canAccessConversation(req, req.params.conversationId, "canUploadDocuments");
  const request = await DocumentRequest.findOne({ _id: req.params.requestId, conversationId: req.params.conversationId });
  if (!request) throw new AppError("Document request was not found.", 404, "DOCUMENT_REQUEST_NOT_FOUND");
  assertTransition("DOCUMENT_REQUEST", request.status, "SUBMITTED");
  if (!Array.isArray(req.body.mediaIds) || req.body.mediaIds.length === 0) throw new AppError("At least one media ID is required.", 422, "DOCUMENT_MEDIA_REQUIRED");
  await assertMediaAccessible(req.body.mediaIds, { userId: req.userId, admin: isAdmin(req), allowPublic: false });
  request.submittedMediaIds = req.body.mediaIds;
  request.status = "SUBMITTED";
  request.submittedAt = new Date();
  await request.save();
  return sendSuccess(res, { message: "Requested documents submitted successfully.", data: request });
});

const reviewDocumentRequest = asyncHandler(async (req, res) => {
  await canAccessConversation(req, req.params.conversationId);
  if (!isAdmin(req)) throw new AppError("Only administrators can review submitted documents.", 403, "FORBIDDEN");
  const request = await DocumentRequest.findOne({ _id: req.params.requestId, conversationId: req.params.conversationId });
  if (!request) throw new AppError("Document request was not found.", 404, "DOCUMENT_REQUEST_NOT_FOUND");
  assertTransition("DOCUMENT_REQUEST", request.status, req.body.status);
  request.status = req.body.status;
  request.reviewedAt = new Date();
  await request.save();
  return sendSuccess(res, { message: `Document request status changed to ${request.status}.`, data: request });
});

module.exports = {
  createGeneral, listMine, listAdmin, getById, assignAdmin, changeStatus,
  inviteParticipant, respondToInvitation, removeParticipant,
  listMessages, sendMessage, editMessage, deleteMessage, markMessageRead,
  createDocumentRequest, listDocumentRequests, submitDocumentRequest, reviewDocumentRequest,
};
