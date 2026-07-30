const ModerationReport = require("../models/moderationReportModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { requireTarget } = require("../helpers/targetRegistry");
const { writeAudit } = require("../helpers/activity");

const create = asyncHandler(async (req, res) => {
  await requireTarget(req.body.targetType, req.body.targetId);
  const existing = await ModerationReport.findOne({
    reportedBy: req.userId,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    status: { $in: ["OPEN", "UNDER_REVIEW"] },
  });
  if (existing) throw new AppError("You already have an active report for this item.", 409, "ACTIVE_REPORT_EXISTS");
  const report = await ModerationReport.create({
    reportedBy: req.userId,
    ...pick(req.body, ["targetType", "targetId", "reason", "description"]),
  });
  return sendSuccess(res, { statusCode: 201, message: "Moderation report submitted successfully.", data: report });
});

const listMine = asyncHandler(async (req, res) => {
  const reports = await ModerationReport.find({ reportedBy: req.userId }).sort({ createdAt: -1 });
  return sendSuccess(res, { message: "Your moderation reports were retrieved successfully.", data: reports });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const field of ["status", "targetType", "reason", "reviewedBy"]) if (req.query[field]) filter[field] = req.query[field];
  const [items, total] = await Promise.all([
    ModerationReport.find(filter).populate("reportedBy reviewedBy", "name email role").sort({ createdAt: 1 }).skip(skip).limit(limit),
    ModerationReport.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Moderation reports retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const updateStatus = asyncHandler(async (req, res) => {
  const report = await ModerationReport.findById(req.params.reportId);
  if (!report) throw new AppError("Moderation report was not found.", 404, "MODERATION_REPORT_NOT_FOUND");
  const transitions = {
    OPEN: ["UNDER_REVIEW", "RESOLVED", "REJECTED"],
    UNDER_REVIEW: ["RESOLVED", "REJECTED"],
    RESOLVED: [],
    REJECTED: [],
  };
  const nextStatus = req.body.status;
  if (!transitions[report.status]?.includes(nextStatus)) {
    throw new AppError(
      `Moderation status cannot change from ${report.status} to ${nextStatus}.`,
      422,
      "INVALID_MODERATION_TRANSITION",
      { currentStatus: report.status, nextStatus, allowed: transitions[report.status] || [] }
    );
  }
  if (["RESOLVED", "REJECTED"].includes(nextStatus) && !req.body.resolutionNote?.trim()) {
    throw new AppError("A resolution note is required when closing a moderation report.", 422, "RESOLUTION_NOTE_REQUIRED");
  }
  report.status = nextStatus;
  report.reviewedBy = req.userId;
  report.resolutionNote = req.body.resolutionNote?.trim() || null;
  await report.save();
  await writeAudit(req, { action: "CHANGE_STATUS", targetType: "MODERATION_REPORT", targetId: report._id, after: report.toObject() });
  return sendSuccess(res, { message: `Moderation report status changed to ${report.status}.`, data: report });
});

module.exports = { create, listMine, listAdmin, updateStatus };
