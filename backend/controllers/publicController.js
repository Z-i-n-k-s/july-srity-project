const DocumentaryItem = require("../models/documentaryItemModel");
const DocumentarySubmission = require("../models/documentarySubmissionModel");
const VerificationReview = require("../models/verificationReviewModel");
const SupportCase = require("../models/supportCaseModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const SiteSetting = require("../models/siteSettingModel");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");

const transparencyStats = asyncHandler(async (_req, res) => {
  const [
    preservedRecords,
    reviewedTestimonies,
    linkedMediaResult,
    supportRequestsRecorded,
    completedRequests,
    publishedCorrections,
    activeMissingPersons,
  ] = await Promise.all([
    DocumentaryItem.countDocuments({ status: "PUBLISHED", deletedAt: null }),
    VerificationReview.countDocuments({ targetType: "DOCUMENTARY_SUBMISSION", status: { $in: ["VERIFIED", "REJECTED"] } }),
    DocumentaryItem.aggregate([
      { $match: { status: "PUBLISHED", deletedAt: null } },
      { $project: { count: { $size: { $ifNull: ["$mediaIds", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
    SupportCase.countDocuments({ deletedAt: null }),
    SupportCase.countDocuments({ status: { $in: ["RESOLVED", "CLOSED"] }, deletedAt: null }),
    DocumentarySubmission.countDocuments({ submissionType: "CORRECTION", status: "PUBLISHED", deletedAt: null }),
    MissingPersonReport.countDocuments({ status: "VERIFIED_MISSING", deletedAt: null }),
  ]);

  return sendSuccess(res, {
    message: "Transparency statistics retrieved successfully.",
    data: {
      label: "Live platform data",
      preservedRecords,
      reviewedTestimonies,
      sourceRecordsLinked: linkedMediaResult[0]?.total || 0,
      injurySupportRequestsRecorded: supportRequestsRecorded,
      requestsMarkedCompleted: completedRequests,
      publishedCorrections,
      activeVerifiedMissingPersonReports: activeMissingPersons,
      generatedAt: new Date().toISOString(),
    },
  });
});

const publicSettings = asyncHandler(async (_req, res) => {
  const allowedKeys = [
    "maintenanceMode", "archiveSubmissionEnabled", "supportRequestsEnabled",
    "missingPersonReportsEnabled", "emergencyNotice", "privacyVersion",
  ];
  const settings = await SiteSetting.find({ key: { $in: allowedKeys } }).select("key value description updatedAt");
  return sendSuccess(res, { message: "Public site settings retrieved successfully.", data: settings });
});

const julySathiActions = asyncHandler(async (req, res) => {
  const action = String(req.query.action || "WELCOME").toUpperCase();
  const responses = {
    WELCOME: {
      messageBn: "আমি July Sathi। কীভাবে সাহায্য করতে পারি?",
      messageEn: "I am July Sathi. How can I help?",
      actions: ["SHARE_TESTIMONY", "INJURY_SUPPORT", "EXPLORE_ARCHIVE", "VERIFICATION", "OFFLINE_QUEUE", "EMERGENCY_INFORMATION"],
    },
    SHARE_TESTIMONY: { messageEn: "Open the testimony form. Save text and metadata locally while offline, then submit it to POST /api/submissions when online.", target: "SUBMISSION_FORM" },
    INJURY_SUPPORT: { messageEn: "Open the injury-support form. This platform is not an emergency medical service.", target: "SUPPORT_FORM" },
    EXPLORE_ARCHIVE: { messageEn: "Browse published records in the July Archive.", target: "ARCHIVE_SECTION" },
    VERIFICATION: { messageEn: "File integrity is not the same as truth verification. Hashes detect changes; human review checks source and context.", target: "VERIFICATION_SECTION" },
    OFFLINE_QUEUE: { messageEn: "Keep small text drafts in localStorage. Do not store large files there; attach them after reconnecting.", target: "OFFLINE_QUEUE" },
    EMERGENCY_INFORMATION: { messageEn: "This website is not an emergency hotline. For immediate danger or urgent medical need, contact the appropriate local emergency service or nearest hospital.", target: "SAFETY_INFO" },
  };
  return sendSuccess(res, { message: "July Sathi response generated.", data: responses[action] || responses.WELCOME });
});

module.exports = { transparencyStats, publicSettings, julySathiActions };
