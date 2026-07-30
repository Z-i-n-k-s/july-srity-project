const VerificationReview = require("../models/verificationReviewModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const SupportCaseStatusHistory = require("../models/supportCaseStatusHistoryModel");
const MissingPersonStatusHistory = require("../models/missingPersonStatusHistoryModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { requireTarget } = require("../helpers/targetRegistry");
const { assertTransition } = require("../helpers/statusTransitions");
const { createNotification, writeAudit } = require("../helpers/activity");
const { assertMediaPublishable } = require("../helpers/mediaValidation");

function ownerForTarget(type, target) {
  const fields = {
    DOCUMENTARY_SUBMISSION: "submittedBy",
    SUPPORT_CASE: "createdBy",
    MISSING_PERSON_REPORT: "reportedBy",
    MISSING_PERSON_SIGHTING: "submittedBy",
    MEDIA_ASSET: "uploadedBy",
    JULY_EVENT: "createdBy",
  };
  return target[fields[type]] || null;
}

async function applyReviewResult(review, target) {
  const previousStatus = target.status || target.moderationStatus || null;
  const verified = review.status === "VERIFIED";
  const rejected = review.status === "REJECTED";
  const needsInfo = review.status === "NEEDS_INFORMATION";

  switch (review.targetType) {
    case "DOCUMENTARY_SUBMISSION":
      if (verified) { target.status = "VERIFIED"; target.verifiedAt = new Date(); }
      if (rejected) { target.status = "REJECTED"; target.rejectionReason = review.adminComment || "The submission did not pass verification."; }
      if (needsInfo) target.status = "NEEDS_INFORMATION";
      break;
    case "SUPPORT_CASE":
      if (verified) { target.status = "VERIFIED"; target.verifiedAt = new Date(); }
      if (rejected) target.status = "REJECTED";
      if (needsInfo) target.status = "ACTION_REQUIRED";
      break;
    case "MISSING_PERSON_REPORT":
      if (verified) {
        await assertMediaPublishable([target.profileMediaId]);
        target.status = "VERIFIED_MISSING";
        target.verifiedAt = new Date();
        target.publishedAt = target.publishedAt || new Date();
      }
      if (rejected) target.status = "FALSE_REPORT";
      if (needsInfo) target.status = "NEEDS_INFORMATION";
      break;
    case "MISSING_PERSON_SIGHTING":
      if (verified) target.status = "VERIFIED";
      if (rejected) target.status = "REJECTED";
      if (needsInfo) target.status = "UNDER_REVIEW";
      target.reviewedBy = review.reviewedBy;
      break;
    case "MEDIA_ASSET":
      if (verified) target.moderationStatus = "APPROVED";
      if (rejected) target.moderationStatus = "REJECTED";
      break;
    case "JULY_EVENT":
      if (verified) {
        if (target.coverMediaId) await assertMediaPublishable([target.coverMediaId]);
        target.status = "VERIFIED";
        target.verifiedBy = review.reviewedBy;
      }
      if (rejected || needsInfo) target.status = "DRAFT";
      break;
    default:
      throw new AppError("This target type cannot be finalized by the verification controller.", 422, "UNSUPPORTED_REVIEW_TARGET");
  }
  await target.save();
  if (review.targetType === "SUPPORT_CASE" && target.status !== previousStatus) {
    await SupportCaseStatusHistory.create({
      supportCaseId: target._id,
      previousStatus,
      newStatus: target.status,
      changedBy: review.reviewedBy,
      publicNote: review.publicVerificationNote || `Verification result: ${review.status}.`,
      privateNote: review.adminComment || null,
    });
  }
  if (review.targetType === "MISSING_PERSON_REPORT" && target.status !== previousStatus) {
    await MissingPersonStatusHistory.create({
      missingPersonReportId: target._id,
      previousStatus,
      newStatus: target.status,
      changedBy: review.reviewedBy,
      publicNote: review.publicVerificationNote || `Verification result: ${review.status}.`,
      privateNote: review.adminComment || null,
    });
  }
}

const create = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body;
  if (!targetType || !targetId) throw new AppError("targetType and targetId are required.", 422, "REVIEW_TARGET_REQUIRED");
  await requireTarget(targetType, targetId);
  const existingOpen = await VerificationReview.findOne({
    targetType,
    targetId,
    status: { $in: ["PENDING", "IN_PROGRESS", "NEEDS_INFORMATION"] },
  });
  if (existingOpen) throw new AppError("An active verification review already exists for this target.", 409, "ACTIVE_REVIEW_EXISTS");

  const review = await VerificationReview.create({
    targetType,
    targetId,
    reviewedBy: req.userId,
    status: ["PENDING", "IN_PROGRESS"].includes(req.body.status) ? req.body.status : "PENDING",
    verificationChecks: req.body.verificationChecks || [],
    evidenceMediaIds: req.body.evidenceMediaIds || [],
    adminComment: req.body.adminComment || null,
    publicVerificationNote: req.body.publicVerificationNote || null,
  });
  await writeAudit(req, { action: "CREATE", targetType: "VERIFICATION_REVIEW", targetId: review._id, after: review.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "Verification review created successfully.", data: review });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const field of ["targetType", "targetId", "reviewedBy", "status"]) if (req.query[field]) filter[field] = req.query[field];
  const [reviews, total] = await Promise.all([
    VerificationReview.find(filter)
      .select("+adminComment")
      .populate("reviewedBy", "name email")
      .populate("evidenceMediaIds", "secureUrl originalName fileType")
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    VerificationReview.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Verification reviews retrieved successfully.", data: reviews, meta: paginationMeta({ page, limit, total }) });
});

const getById = asyncHandler(async (req, res) => {
  const review = await VerificationReview.findById(req.params.reviewId)
    .select("+adminComment")
    .populate("reviewedBy", "name email")
    .populate("evidenceMediaIds", "secureUrl originalName fileType");
  if (!review) throw new AppError("Verification review was not found.", 404, "REVIEW_NOT_FOUND");
  return sendSuccess(res, { message: "Verification review retrieved successfully.", data: review });
});

const getPublicForTarget = asyncHandler(async (req, res) => {
  const publicTypes = new Set(["DOCUMENTARY_SUBMISSION", "MISSING_PERSON_REPORT", "MEDIA_ASSET", "JULY_EVENT"]);
  if (!publicTypes.has(req.params.targetType)) {
    throw new AppError("Verification details for this target type are not public.", 403, "REVIEW_NOT_PUBLIC");
  }
  const target = await requireTarget(req.params.targetType, req.params.targetId);
  if (req.params.targetType === "DOCUMENTARY_SUBMISSION") {
    const published = await DocumentaryItem.exists({ sourceSubmissionId: target._id, status: "PUBLISHED", deletedAt: null });
    if (!published) throw new AppError("This submission is not part of a published archive record.", 404, "PUBLIC_REVIEW_NOT_FOUND");
  }
  if (req.params.targetType === "MISSING_PERSON_REPORT" && target.status !== "VERIFIED_MISSING") {
    throw new AppError("Verification details for this report are not public.", 404, "PUBLIC_REVIEW_NOT_FOUND");
  }
  if (req.params.targetType === "MEDIA_ASSET" && (target.visibility !== "PUBLIC" || target.moderationStatus !== "APPROVED")) {
    throw new AppError("Verification details for this media file are not public.", 404, "PUBLIC_REVIEW_NOT_FOUND");
  }
  if (req.params.targetType === "JULY_EVENT" && target.status !== "PUBLISHED") {
    throw new AppError("Verification details for this event are not public.", 404, "PUBLIC_REVIEW_NOT_FOUND");
  }
  const review = await VerificationReview.findOne({
    targetType: req.params.targetType,
    targetId: req.params.targetId,
    status: { $in: ["VERIFIED", "REJECTED"] },
  })
    .select("targetType targetId status verificationChecks.checkType verificationChecks.status publicVerificationNote reviewedAt createdAt")
    .sort({ reviewedAt: -1, createdAt: -1 });
  if (!review) throw new AppError("No completed public verification review exists for this target.", 404, "PUBLIC_REVIEW_NOT_FOUND");
  return sendSuccess(res, { message: "Public verification information retrieved successfully.", data: review });
});

const update = asyncHandler(async (req, res) => {
  const review = await VerificationReview.findById(req.params.reviewId).select("+adminComment");
  if (!review) throw new AppError("Verification review was not found.", 404, "REVIEW_NOT_FOUND");
  const before = review.toObject();
  const updates = pick(req.body, ["verificationChecks", "evidenceMediaIds", "adminComment", "publicVerificationNote", "status"]);
  if (updates.status && !["PENDING", "IN_PROGRESS"].includes(updates.status)) {
    throw new AppError("Use the finalize endpoint for VERIFIED, REJECTED, or NEEDS_INFORMATION results.", 422, "USE_REVIEW_FINALIZE_ENDPOINT");
  }
  if (updates.status) assertTransition("REVIEW", review.status, updates.status);
  Object.assign(review, updates);
  review.reviewedBy = req.userId;
  if (["VERIFIED", "REJECTED"].includes(review.status)) review.reviewedAt = new Date();
  await review.save();
  await writeAudit(req, { action: "UPDATE", targetType: "VERIFICATION_REVIEW", targetId: review._id, before, after: review.toObject() });
  return sendSuccess(res, { message: "Verification review updated successfully.", data: review });
});

const finalize = asyncHandler(async (req, res) => {
  const review = await VerificationReview.findById(req.params.reviewId).select("+adminComment");
  if (!review) throw new AppError("Verification review was not found.", 404, "REVIEW_NOT_FOUND");
  const { status } = req.body;
  if (!["VERIFIED", "REJECTED", "NEEDS_INFORMATION"].includes(status)) {
    throw new AppError("Final status must be VERIFIED, REJECTED, or NEEDS_INFORMATION.", 422, "INVALID_REVIEW_RESULT");
  }
  assertTransition("REVIEW", review.status, status);

  if (status === "VERIFIED") {
    if (!review.verificationChecks.length) {
      throw new AppError("At least one documented verification check is required before verification.", 422, "VERIFICATION_CHECK_REQUIRED");
    }
    const incomplete = review.verificationChecks.filter((check) => check.status !== "PASSED");
    if (incomplete.length) {
      throw new AppError("Every included verification check must be PASSED before the record can be verified.", 422, "INCOMPLETE_VERIFICATION_CHECKS", { incompleteCheckTypes: incomplete.map((check) => check.checkType) });
    }
  }
  if (status === "REJECTED" && !req.body.adminComment && !review.adminComment) {
    throw new AppError("An admin comment is required when rejecting a record.", 422, "REJECTION_COMMENT_REQUIRED");
  }

  review.status = status;
  review.reviewedBy = req.userId;
  review.adminComment = req.body.adminComment ?? review.adminComment;
  review.publicVerificationNote = req.body.publicVerificationNote ?? review.publicVerificationNote;
  review.reviewedAt = new Date();
  await review.save();

  const target = await requireTarget(review.targetType, review.targetId);
  await applyReviewResult(review, target);

  const ownerId = ownerForTarget(review.targetType, target);
  if (ownerId) {
    const entityMap = {
      DOCUMENTARY_SUBMISSION: "DOCUMENTARY_SUBMISSION",
      SUPPORT_CASE: "SUPPORT_CASE",
      MISSING_PERSON_REPORT: "MISSING_PERSON_REPORT",
      MISSING_PERSON_SIGHTING: "MISSING_PERSON_SIGHTING",
      JULY_EVENT: "JULY_EVENT",
      MEDIA_ASSET: "MEDIA_ASSET",
    };
    await createNotification({
      userId: ownerId,
      type: review.targetType === "SUPPORT_CASE" ? "SUPPORT_UPDATE" : review.targetType.includes("MISSING_PERSON") ? "MISSING_PERSON_UPDATE" : status === "REJECTED" ? "SUBMISSION_REJECTED" : "STATUS_CHANGED",
      title: "Verification review updated",
      message: `The review result is ${status}.`,
      entityType: entityMap[review.targetType] || "DOCUMENTARY_SUBMISSION",
      entityId: target._id,
    });
  }

  await writeAudit(req, { action: status === "VERIFIED" ? "VERIFY" : status === "REJECTED" ? "REJECT" : "CHANGE_STATUS", targetType: review.targetType, targetId: review.targetId, after: { reviewId: review._id, result: status } });
  return sendSuccess(res, { message: `Verification review finalized as ${status}.`, data: { review, target } });
});

module.exports = { create, list, getById, getPublicForTarget, update, finalize };
