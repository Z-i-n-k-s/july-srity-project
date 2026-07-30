const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const AppError = require("./AppError");

function isAdmin(req) {
  return req.user?.role === "ADMIN";
}

function isOwner(document, userId, ownerFields = ["createdBy", "submittedBy", "reportedBy", "uploadedBy", "userId"]) {
  return ownerFields.some((field) => document?.[field] && String(document[field]) === String(userId));
}

function requireOwnerOrAdmin(req, document, ownerFields) {
  if (isAdmin(req) || isOwner(document, req.userId, ownerFields)) return;
  throw new AppError("You do not have permission to access this record.", 403, "FORBIDDEN");
}

async function canAccessConversation(req, conversationId, permission = null) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation was not found.", 404, "CONVERSATION_NOT_FOUND");

  if (isAdmin(req) || String(conversation.createdBy) === String(req.userId) || String(conversation.assignedAdminId) === String(req.userId)) {
    return { conversation, participant: null };
  }

  const participant = await ConversationParticipant.findOne({
    conversationId,
    userId: req.userId,
    invitationStatus: "ACCEPTED",
    removedAt: null,
  });

  if (!participant) throw new AppError("You are not a participant in this conversation.", 403, "CONVERSATION_ACCESS_DENIED");
  if (permission && participant.permissions?.[permission] !== true) {
    throw new AppError(`Your conversation role does not allow ${permission}.`, 403, "CONVERSATION_PERMISSION_DENIED");
  }
  return { conversation, participant };
}

module.exports = { isAdmin, isOwner, requireOwnerOrAdmin, canAccessConversation };
