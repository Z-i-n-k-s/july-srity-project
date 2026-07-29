const Consent = require("../models/consentModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta } = require("../helpers/query");
const { requireTarget } = require("../helpers/targetRegistry");
const { isOwner } = require("../helpers/access");

const listMine = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.userId };
  if (req.query.targetType) filter.targetType = req.query.targetType;
  if (req.query.targetId) filter.targetId = req.query.targetId;
  if (req.query.consentType) filter.consentType = req.query.consentType;
  const [items, total] = await Promise.all([
    Consent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Consent.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Consent records retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const grant = asyncHandler(async (req, res) => {
  const { targetType, targetId, consentType } = req.body;
  const target = await requireTarget(targetType, targetId);
  const ownerFields = {
    DOCUMENTARY_SUBMISSION: ["submittedBy"],
    SUPPORT_CASE: ["createdBy", "injuredPersonUserId"],
    MISSING_PERSON_REPORT: ["reportedBy"],
  }[targetType] || [];
  if (!isOwner(target, req.userId, ownerFields)) {
    throw new AppError("You can only grant consent for a record that belongs to you.", 403, "CONSENT_TARGET_FORBIDDEN");
  }
  const consent = await Consent.create({
    userId: req.userId,
    targetType,
    targetId,
    consentType,
    granted: true,
    consentTextVersion: req.body.consentTextVersion || process.env.CONSENT_TEXT_VERSION || "1.0",
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    grantedAt: new Date(),
  });
  return sendSuccess(res, { statusCode: 201, message: "Consent recorded successfully.", data: consent });
});

const withdraw = asyncHandler(async (req, res) => {
  const previous = await Consent.findOne({ _id: req.params.consentId, userId: req.userId });
  if (!previous) throw new AppError("Consent record was not found.", 404, "CONSENT_NOT_FOUND");
  if (!previous.granted) throw new AppError("This consent was already withdrawn.", 409, "CONSENT_ALREADY_WITHDRAWN");
  const withdrawn = await Consent.create({
    userId: req.userId,
    targetType: previous.targetType,
    targetId: previous.targetId,
    consentType: previous.consentType,
    granted: false,
    consentTextVersion: previous.consentTextVersion,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    withdrawnAt: new Date(),
  });
  return sendSuccess(res, { statusCode: 201, message: "Consent withdrawn successfully. An administrator may need to review the affected record.", data: withdrawn });
});

module.exports = { listMine, grant, withdraw };
