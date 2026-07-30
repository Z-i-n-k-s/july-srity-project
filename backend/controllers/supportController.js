const SupportCase = require("../models/supportCaseModel");
const User = require("../models/userModel");
const SupportCasePrivateDetail = require("../models/supportCasePrivateDetailModel");
const SupportCaseStatusHistory = require("../models/supportCaseStatusHistoryModel");
const SupportAssistanceRecord = require("../models/supportAssistanceRecordModel");
const Conversation = require("../models/conversationModel");
const ConversationParticipant = require("../models/conversationParticipantModel");
const Message = require("../models/messageModel");
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
const { assertMediaAccessible } = require("../helpers/mediaValidation");
const { removeEncryptedFields } = require("../helpers/sanitize");

const categoryMap = {
  "Medical Treatment": "MEDICAL_TREATMENT",
  "Medicine": "MEDICINE",
  "Rehabilitation": "REHABILITATION",
  "Legal Support": "LEGAL_SUPPORT",
};
const relationshipMap = {
  self: "SELF", parent: "PARENT", sibling: "SIBLING", spouse: "SPOUSE",
  relative: "RELATIVE", friend: "FRIEND", representative: "REPRESENTATIVE",
};
const priorityByInjuryLevel = {
  STABLE: "NORMAL",
  NEEDS_ATTENTION: "HIGH",
  URGENT: "URGENT",
  CRITICAL: "CRITICAL",
};

function normalizeEnum(value) {
  return String(value || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

function normalizeSupportTypes(body) {
  const raw = body.supportTypes || (body.supportCategory ? [body.supportCategory] : []);
  return raw.map((value) => categoryMap[value] || normalizeEnum(value));
}

function normalizeRelationship(value) {
  return relationshipMap[String(value || "").trim().toLowerCase()] || normalizeEnum(value || "SELF");
}

function privateSelect(query) {
  return query.select("+injuredPerson +injuryDetails +emergencyContact +medicalMediaIds +identityMediaIds");
}

const create = asyncHandler(async (req, res) => {
  if (req.body.clientDraftId) {
    const existing = await SupportCase.findOne({ createdBy: req.userId, clientDraftId: req.body.clientDraftId, deletedAt: null });
    if (existing) {
      return sendSuccess(res, { message: "This offline support draft was already synchronized.", data: { supportCase: existing } });
    }
  }
  if (req.body.consent !== true && req.body.consentGranted !== true) {
    throw new AppError("Consent is required before a support request can be submitted.", 422, "CONSENT_REQUIRED");
  }

  const injuryLevel = normalizeEnum(req.body.injuryLevel || "NEEDS_ATTENTION");
  const supportTypes = normalizeSupportTypes(req.body);
  if (!supportTypes.length) throw new AppError("Select at least one support category.", 422, "SUPPORT_TYPE_REQUIRED");

  const nestedPrivate = req.body.privateDetails || {};
  const injuredPerson = nestedPrivate.injuredPerson
    ? { ...nestedPrivate.injuredPerson }
    : {
        fullName: req.body.injuredPersonName || req.body.requesterName,
        dateOfBirth: req.body.dateOfBirth || null,
        gender: req.body.gender || null,
        phone: req.body.contactNumber || null,
        alternativePhone: req.body.alternativePhone || null,
        address: req.body.address || null,
      };
  const rawNationalId = injuredPerson.nationalIdNumber || req.body.nationalIdNumber;
  delete injuredPerson.nationalIdNumber;
  delete injuredPerson.nationalIdNumberEncrypted;
  injuredPerson.nationalIdNumberEncrypted = rawNationalId ? encryptField(rawNationalId) : null;
  if (!injuredPerson.fullName?.trim()) throw new AppError("The injured person's name is required.", 422, "INJURED_PERSON_NAME_REQUIRED");

  const injuryDetails = nestedPrivate.injuryDetails || {
    injuryDate: req.body.injuryDate || null,
    injuryLocation: req.body.approximateLocation || req.body.injuryLocation || null,
    injuryDescription: req.body.description || req.body.summary,
    currentCondition: req.body.currentCondition || req.body.injuryLevel || null,
    hospitalName: req.body.hospitalName || null,
    doctorName: req.body.doctorName || null,
    estimatedCost: req.body.estimatedCost ?? null,
  };
  if (!injuryDetails.injuryDescription?.trim()) throw new AppError("A short description of the support need is required.", 422, "SUPPORT_DESCRIPTION_REQUIRED");

  const medicalMediaIds = nestedPrivate.medicalMediaIds || req.body.medicalMediaIds || [];
  const identityMediaIds = nestedPrivate.identityMediaIds || req.body.identityMediaIds || [];
  await assertMediaAccessible([...medicalMediaIds, ...identityMediaIds], {
    userId: req.userId,
    admin: isAdmin(req),
    allowPublic: false,
  });

  const supportCase = await SupportCase.create({
    caseNumber: generatePublicNumber("SUP"),
    clientDraftId: req.body.clientDraftId || null,
    createdBy: req.userId,
    injuredPersonUserId: req.body.injuredPersonUserId || null,
    requestRelationship: normalizeRelationship(req.body.requestRelationship || req.body.relationship),
    supportTypes,
    injuryLevel,
    title: req.body.title || `${supportTypes[0].replaceAll("_", " ")} support request`,
    summary: req.body.summary || req.body.description,
    districtId: req.body.districtId || null,
    priority: isAdmin(req) && req.body.priority ? req.body.priority : (priorityByInjuryLevel[injuryLevel] || "NORMAL"),
    status: "NEW",
    submittedAt: new Date(),
  });

  try {
    const privateDetail = await SupportCasePrivateDetail.create({
      supportCaseId: supportCase._id,
      injuredPerson,
      injuryDetails,
      emergencyContact: nestedPrivate.emergencyContact || req.body.emergencyContact || undefined,
      medicalMediaIds,
      identityMediaIds,
    });

    const conversation = await Conversation.create({
      conversationNumber: generatePublicNumber("CONV"),
      type: "SUPPORT_ROOM",
      subjectType: "SUPPORT_CASE",
      subjectId: supportCase._id,
      title: `Support case ${supportCase.caseNumber}`,
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
    supportCase.conversationId = conversation._id;
    await supportCase.save();

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
      consentType: "DATA_PROCESSING",
      granted: true,
      consentTextVersion: process.env.CONSENT_TEXT_VERSION || "1.0",
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || null,
      grantedAt: new Date(),
    });

    await writeAudit(req, { action: "CREATE", targetType: "SUPPORT_CASE", targetId: supportCase._id, after: supportCase.toObject() });
    return sendSuccess(res, {
      statusCode: 201,
      message: "Support request submitted successfully. This platform is not an emergency medical service.",
      data: { supportCase, privateDetail: removeEncryptedFields(privateDetail) },
    });
  } catch (error) {
    const orphanConversation = await Conversation.findOne({ subjectType: "SUPPORT_CASE", subjectId: supportCase._id }).select("_id");
    await Promise.allSettled([
      SupportCasePrivateDetail.deleteOne({ supportCaseId: supportCase._id }),
      SupportCaseStatusHistory.deleteMany({ supportCaseId: supportCase._id }),
      Consent.deleteMany({ targetType: "SUPPORT_CASE", targetId: supportCase._id }),
      orphanConversation ? ConversationParticipant.deleteMany({ conversationId: orphanConversation._id }) : Promise.resolve(),
      orphanConversation ? Message.deleteMany({ conversationId: orphanConversation._id }) : Promise.resolve(),
      Conversation.deleteOne({ subjectType: "SUPPORT_CASE", subjectId: supportCase._id }),
      SupportCase.deleteOne({ _id: supportCase._id }),
    ]);
    throw error;
  }
});

const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { createdBy: req.userId, deletedAt: null };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    SupportCase.find(filter).populate("districtId", "name nameBn type").sort({ createdAt: -1 }).skip(skip).limit(limit),
    SupportCase.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Your support requests were retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };
  for (const field of ["status", "priority", "injuryLevel", "createdBy", "districtId"]) if (req.query[field]) filter[field] = req.query[field];
  if (req.query.adminId) filter.assignedAdminIds = req.query.adminId;
  if (req.query.supportType) filter.supportTypes = req.query.supportType;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ title: q }, { summary: q }, { caseNumber: q }];
  }
  const [items, total] = await Promise.all([
    SupportCase.find(filter)
      .populate("createdBy", "name email phone")
      .populate("assignedAdminIds", "name email")
      .populate("districtId", "name nameBn type")
      .sort({ priority: -1, submittedAt: 1 }).skip(skip).limit(limit),
    SupportCase.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Support cases retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const getById = asyncHandler(async (req, res) => {
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null })
    .populate("createdBy", "name email phone")
    .populate("assignedAdminIds", "name email")
    .populate("districtId", "name nameBn type");
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  requireOwnerOrAdmin(req, supportCase, ["createdBy", "injuredPersonUserId"]);

  const [privateDetails, history, assistance] = await Promise.all([
    privateSelect(SupportCasePrivateDetail.findOne({ supportCaseId: supportCase._id })),
    SupportCaseStatusHistory.find({ supportCaseId: supportCase._id })
      .select(isAdmin(req) ? "+privateNote" : "-privateNote")
      .populate("changedBy", "name role")
      .sort({ createdAt: 1 }),
    SupportAssistanceRecord.find({ supportCaseId: supportCase._id }).populate("createdBy", "name role").sort({ createdAt: -1 }),
  ]);

  await writeAudit(req, { action: "VIEW_SENSITIVE_DATA", targetType: "SUPPORT_CASE", targetId: supportCase._id });
  return sendSuccess(res, {
    message: "Support case retrieved successfully.",
    data: { supportCase, privateDetails: removeEncryptedFields(privateDetails), history, assistance },
  });
});

const update = asyncHandler(async (req, res) => {
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null });
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  requireOwnerOrAdmin(req, supportCase, ["createdBy", "injuredPersonUserId"]);
  if (!isAdmin(req) && !["NEW", "ACTION_REQUIRED"].includes(supportCase.status)) {
    throw new AppError("This support case cannot currently be edited by the requester.", 422, "SUPPORT_CASE_NOT_EDITABLE");
  }

  const before = supportCase.toObject();
  const caseFields = isAdmin(req)
    ? ["supportTypes", "injuryLevel", "title", "summary", "districtId", "priority", "duplicateOfCaseId"]
    : ["supportTypes", "injuryLevel", "title", "summary", "districtId"];
  const updates = pick(req.body, caseFields);
  if (Object.prototype.hasOwnProperty.call(updates, "supportTypes")) {
    updates.supportTypes = normalizeSupportTypes({ supportTypes: updates.supportTypes });
    if (!updates.supportTypes.length) throw new AppError("Select at least one support category.", 422, "SUPPORT_TYPE_REQUIRED");
  }
  if (Object.prototype.hasOwnProperty.call(updates, "injuryLevel")) updates.injuryLevel = normalizeEnum(updates.injuryLevel);
  Object.assign(supportCase, updates);
  await supportCase.save();

  if (req.body.privateDetails) {
    const updates = { ...req.body.privateDetails };
    const updatedMediaIds = [
      ...(updates.medicalMediaIds || []),
      ...(updates.identityMediaIds || []),
    ];
    await assertMediaAccessible(updatedMediaIds, {
      userId: req.userId,
      admin: isAdmin(req),
      allowPublic: false,
    });
    if (updates.injuredPerson) {
      const rawNationalId = updates.injuredPerson.nationalIdNumber;
      delete updates.injuredPerson.nationalIdNumber;
      delete updates.injuredPerson.nationalIdNumberEncrypted;
      if (rawNationalId) updates.injuredPerson.nationalIdNumberEncrypted = encryptField(rawNationalId);
    }
    await SupportCasePrivateDetail.findOneAndUpdate(
      { supportCaseId: supportCase._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
  }
  await writeAudit(req, { action: "UPDATE", targetType: "SUPPORT_CASE", targetId: supportCase._id, before, after: supportCase.toObject() });
  return sendSuccess(res, { message: "Support case updated successfully.", data: supportCase });
});

const assignAdmins = asyncHandler(async (req, res) => {
  const adminIds = [...new Set((Array.isArray(req.body.adminIds) && req.body.adminIds.length ? req.body.adminIds : [req.userId]).map(String))];
  const validAdminCount = await User.countDocuments({ _id: { $in: adminIds }, role: "ADMIN", accountStatus: "ACTIVE", deletedAt: null });
  if (validAdminCount !== adminIds.length) throw new AppError("Every assigned user must be an active administrator.", 422, "INVALID_ADMIN_ASSIGNMENT");
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null });
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  const previousStatus = supportCase.status;
  supportCase.assignedAdminIds = adminIds;
  if (supportCase.status === "NEW") supportCase.status = "UNDER_REVIEW";
  await supportCase.save();
  if (supportCase.status !== previousStatus) {
    await SupportCaseStatusHistory.create({
      supportCaseId: supportCase._id,
      previousStatus,
      newStatus: supportCase.status,
      changedBy: req.userId,
      publicNote: "Support request assigned for admin review.",
    });
  }

  if (supportCase.conversationId) {
    await Conversation.findByIdAndUpdate(supportCase.conversationId, { assignedAdminId: supportCase.assignedAdminIds[0], status: "OPEN" });
    for (const adminId of supportCase.assignedAdminIds) {
      await ConversationParticipant.findOneAndUpdate(
        { conversationId: supportCase.conversationId, userId: adminId },
        {
          participantRole: "ADMIN", invitationStatus: "ACCEPTED", joinedAt: new Date(),
          permissions: { canSendMessages: true, canUploadDocuments: true, canInviteParticipants: true, canChangeStatus: true, canViewSensitiveFiles: true },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }
  await writeAudit(req, { action: "UPDATE", targetType: "SUPPORT_CASE", targetId: supportCase._id, after: { assignedAdminIds: supportCase.assignedAdminIds, status: supportCase.status } });
  return sendSuccess(res, { message: "Support case assigned successfully.", data: supportCase });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status, publicNote, privateNote } = req.body;
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null });
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  assertTransition("SUPPORT_CASE", supportCase.status, status);
  const previousStatus = supportCase.status;
  const before = supportCase.toObject();
  supportCase.status = status;
  if (status === "VERIFIED") supportCase.verifiedAt = new Date();
  if (status === "RESOLVED") supportCase.resolvedAt = new Date();
  await supportCase.save();

  await SupportCaseStatusHistory.create({
    supportCaseId: supportCase._id,
    previousStatus,
    newStatus: status,
    changedBy: req.userId,
    publicNote: publicNote || `Status changed to ${status}.`,
    privateNote: privateNote || null,
  });
  if (supportCase.conversationId) {
    await Message.create({
      clientMessageId: generatePublicNumber("SYS"),
      conversationId: supportCase.conversationId,
      senderId: req.userId,
      messageType: "STATUS_UPDATE",
      body: publicNote || `Support case status changed from ${previousStatus} to ${status}.`,
      visibility: "ALL_PARTICIPANTS",
    });
    await Conversation.findByIdAndUpdate(supportCase.conversationId, { lastMessageAt: new Date() });
  }
  await createNotification({
    userId: supportCase.createdBy,
    type: "SUPPORT_UPDATE",
    title: "Support request updated",
    message: publicNote || `Your support request is now ${status}.`,
    entityType: "SUPPORT_CASE",
    entityId: supportCase._id,
  });
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "SUPPORT_CASE", targetId: supportCase._id, before, after: supportCase.toObject() });
  return sendSuccess(res, { message: `Support case status changed to ${status}.`, data: supportCase });
});

const createAssistance = asyncHandler(async (req, res) => {
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null });
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  const record = await SupportAssistanceRecord.create({
    supportCaseId: supportCase._id,
    ...pick(req.body, ["assistanceType", "providerName", "description", "amount", "currency", "status", "evidenceMediaIds", "providedAt"]),
    createdBy: req.userId,
  });
  await writeAudit(req, { action: "CREATE", targetType: "SUPPORT_ASSISTANCE", targetId: record._id, after: record.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "Support assistance record created successfully.", data: record });
});

const updateAssistance = asyncHandler(async (req, res) => {
  const record = await SupportAssistanceRecord.findOne({ _id: req.params.assistanceId, supportCaseId: req.params.caseId });
  if (!record) throw new AppError("Support assistance record was not found.", 404, "ASSISTANCE_NOT_FOUND");
  const before = record.toObject();
  Object.assign(record, pick(req.body, ["assistanceType", "providerName", "description", "amount", "currency", "status", "evidenceMediaIds", "providedAt"]));
  await record.save();
  await writeAudit(req, { action: "UPDATE", targetType: "SUPPORT_ASSISTANCE", targetId: record._id, before, after: record.toObject() });
  return sendSuccess(res, { message: "Support assistance record updated successfully.", data: record });
});

const deleteAssistance = asyncHandler(async (req, res) => {
  const record = await SupportAssistanceRecord.findOneAndDelete({ _id: req.params.assistanceId, supportCaseId: req.params.caseId });
  if (!record) throw new AppError("Support assistance record was not found.", 404, "ASSISTANCE_NOT_FOUND");
  await writeAudit(req, { action: "DELETE", targetType: "SUPPORT_ASSISTANCE", targetId: record._id, before: record.toObject() });
  return sendSuccess(res, { message: "Support assistance record deleted successfully.", data: null });
});

const remove = asyncHandler(async (req, res) => {
  const supportCase = await SupportCase.findOne({ _id: req.params.caseId, deletedAt: null });
  if (!supportCase) throw new AppError("Support case was not found.", 404, "SUPPORT_CASE_NOT_FOUND");
  requireOwnerOrAdmin(req, supportCase, ["createdBy"]);
  if (!isAdmin(req) && !["NEW", "CLOSED"].includes(supportCase.status)) {
    throw new AppError("This support case cannot be deleted while it is being processed.", 422, "SUPPORT_CASE_DELETE_BLOCKED");
  }
  supportCase.deletedAt = new Date();
  await supportCase.save({ validateBeforeSave: false });
  await writeAudit(req, { action: "DELETE", targetType: "SUPPORT_CASE", targetId: supportCase._id, before: supportCase.toObject() });
  return sendSuccess(res, { message: "Support case deleted successfully.", data: null });
});

module.exports = {
  create, listMine, listAdmin, getById, update, assignAdmins, changeStatus,
  createAssistance, updateAssistance, deleteAssistance, remove,
};
