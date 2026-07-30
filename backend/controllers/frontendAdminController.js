const DocumentarySubmission = require("../models/documentarySubmissionModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const JulyEvent = require("../models/julyEventModel");
const VerificationReview = require("../models/verificationReviewModel");
const MediaAsset = require("../models/mediaAssetModel");
const SupportCase = require("../models/supportCaseModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const User = require("../models/userModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { slugify } = require("../helpers/identifiers");
const { serializeSubmission, resolveFilter } = require("./frontendSubmissionController");
const {
  formatTime,
  mediaUrl,
  archiveType,
  verificationLabel,
  isObjectId,
} = require("../helpers/frontendCompatibility");

function contentTypeForSubmission(submission) {
  const joined = [submission.submissionType, ...(submission.contentTypes || [])]
    .join(" ")
    .toUpperCase();
  if (joined.includes("VIDEO") || joined.includes("DOCUMENTARY")) return "VIDEO";
  if (joined.includes("AUDIO")) return "AUDIO";
  if (joined.includes("PHOTO") || joined.includes("IMAGE")) return "IMAGE_GALLERY";
  if (joined.includes("STORY")) return "STORY";
  if (joined.includes("TESTIMONY")) return "TESTIMONY";
  return "DOCUMENT";
}

function archiveAdminStatus(status) {
  return status === "PUBLISHED" ? "Published" : "Unpublished";
}

function serializeAdminArchive(item) {
  const cover = item.coverMediaId || (item.mediaIds || [])[0];
  return {
    id: String(item._id),
    slug: item.slug,
    title: item.titleBn || item.title,
    type: archiveType(item.contentType),
    status: archiveAdminStatus(item.status),
    verification: verificationLabel(item.verificationStatus),
    source: item.sourceLabel || "Protected contributor record",
    updatedAt: formatTime(item.updatedAt),
    image: mediaUrl(cover),
  };
}

const dashboard = asyncHandler(async (_req, res) => {
  const [
    pendingSubmissions,
    totalPublished,
    supportOpen,
    missingPending,
    users,
    publishedCorrections,
  ] = await Promise.all([
    DocumentarySubmission.countDocuments({ status: { $in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION"] }, deletedAt: null }),
    DocumentaryItem.countDocuments({ status: "PUBLISHED", deletedAt: null }),
    SupportCase.countDocuments({ status: { $nin: ["RESOLVED", "REJECTED", "CLOSED"] }, deletedAt: null }),
    MissingPersonReport.countDocuments({ status: { $in: ["PENDING_REVIEW", "NEEDS_INFORMATION"] }, deletedAt: null }),
    User.countDocuments({ deletedAt: null }),
    DocumentarySubmission.countDocuments({ submissionType: "CORRECTION", status: "PUBLISHED", deletedAt: null }),
  ]);

  const recentSubmissions = await DocumentarySubmission.find({ deletedAt: null })
    .populate("submittedBy", "name")
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

  return sendSuccess(res, {
    message: "Administrator dashboard retrieved successfully.",
    data: {
      stats: [
        { key: "submissions", label: "Pending submissions", labelBn: "অপেক্ষমাণ জমা", value: pendingSubmissions, trend: "Review queue", tone: "amber" },
        { key: "archive", label: "Published archive records", labelBn: "প্রকাশিত আর্কাইভ", value: totalPublished, trend: "Public", tone: "teal" },
        { key: "support", label: "Active support cases", labelBn: "সক্রিয় সহায়তা কেস", value: supportOpen, trend: "Private", tone: "rose" },
        { key: "missing", label: "Missing-person reviews", labelBn: "নিখোঁজ রিপোর্ট পর্যালোচনা", value: missingPending, trend: "Safety review", tone: "rose" },
        { key: "users", label: "Registered users", labelBn: "নিবন্ধিত ব্যবহারকারী", value: users, trend: "Accounts", tone: "teal" },
        { key: "corrections", label: "Published corrections", labelBn: "প্রকাশিত সংশোধন", value: publishedCorrections, trend: "Transparency", tone: "amber" },
      ],
      recentActivity: recentSubmissions.map((item) => ({
        id: item.submissionNumber || String(item._id),
        title: item.title,
        meta: `${item.submittedBy?.name || "Contributor"} • ${formatTime(item.updatedAt)}`,
        type: "submission",
      })),
    },
  });
});

const listSubmissions = asyncHandler(async (_req, res) => {
  const items = await DocumentarySubmission.find({ deletedAt: null })
    .populate("submittedBy", "name email phone")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus")
    .sort({ submittedAt: 1, createdAt: -1 });
  return sendSuccess(res, {
    message: "Submission review queue retrieved successfully.",
    data: items.map((item) => serializeSubmission(item, { admin: true })),
  });
});

const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({
    ...resolveFilter(req.params.id),
    deletedAt: null,
  })
    .populate("submittedBy", "name email phone")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize moderationStatus");
  if (!submission) throw new AppError("The requested submission was not found.", 404, "SUBMISSION_NOT_FOUND");

  const action = String(req.body.action || "").toLowerCase();
  const actions = {
    approve: { status: "VERIFIED", label: "Approved", review: "VERIFIED" },
    source_checked: { status: "UNDER_REVIEW", label: "Source checked", review: "IN_PROGRESS" },
    request_information: { status: "NEEDS_INFORMATION", label: "Information required", review: "NEEDS_INFORMATION" },
    reject: { status: "REJECTED", label: "Rejected", review: "REJECTED" },
  };
  const decision = actions[action];
  if (!decision) throw new AppError("The review action is invalid.", 422, "INVALID_REVIEW_ACTION", { allowed: Object.keys(actions) });
  if (["reject", "request_information"].includes(action) && String(req.body.note || "").trim().length < 8) {
    throw new AppError("A clear review note of at least 8 characters is required.", 422, "REVIEW_NOTE_REQUIRED");
  }

  submission.status = decision.status;
  submission.reviewLabel = decision.label;
  submission.assignedAdminId = req.userId;
  if (action === "approve") submission.verifiedAt = new Date();
  if (action === "reject") submission.rejectionReason = req.body.note?.trim() || "Rejected during administrator review.";
  await submission.save({ validateBeforeSave: false });

  await VerificationReview.create({
    targetType: "DOCUMENTARY_SUBMISSION",
    targetId: submission._id,
    reviewedBy: req.userId,
    status: decision.review,
    verificationChecks: [
      { checkType: "SOURCE", status: req.body.sourceChecked ? "PASSED" : "PENDING", note: req.body.note || null },
      { checkType: "IDENTITY", status: req.body.privacyConfirmed ? "PASSED" : "PENDING", note: req.body.note || null },
    ],
    evidenceMediaIds: (submission.mediaIds || []).map((media) => media._id || media),
    adminComment: req.body.note || null,
    publicVerificationNote: action === "approve" ? "Source and privacy controls reviewed by an authorised administrator." : null,
    reviewedAt: new Date(),
  });

  let archiveItem = await DocumentaryItem.findOne({ sourceSubmissionId: submission._id, deletedAt: null });
  if (action === "approve" && !archiveItem) {
    const baseSlug = slugify(submission.title);
    let slug = baseSlug;
    let counter = 1;
    while (await DocumentaryItem.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
    const anonymous = submission.anonymityPreference === "HIDE_NAME";
    let event = null;
    if (submission.eventDate) {
      const eventBaseSlug = slugify(`${submission.title}-${new Date(submission.eventDate).toISOString().slice(0, 10)}`);
      let eventSlug = eventBaseSlug;
      let eventCounter = 1;
      while (await JulyEvent.exists({ slug: eventSlug })) {
        eventSlug = `${eventBaseSlug}-${eventCounter}`;
        eventCounter += 1;
      }
      event = await JulyEvent.create({
        title: submission.title,
        slug: eventSlug,
        summary: submission.description || null,
        description: submission.storyContent || null,
        eventDate: submission.eventDate,
        locationDescription: submission.locationDescription || null,
        eventType: "OTHER",
        status: "VERIFIED",
        createdBy: req.userId,
        verifiedBy: req.userId,
      });
    }

    archiveItem = await DocumentaryItem.create({
      sourceSubmissionId: submission._id,
      contentType: contentTypeForSubmission(submission),
      title: submission.title,
      slug,
      summary: submission.description || null,
      body: submission.storyContent || null,
      coverMediaId: submission.mediaIds?.[0]?._id || submission.mediaIds?.[0] || null,
      mediaIds: (submission.mediaIds || []).map((media) => media._id || media),
      eventId: event?._id || null,
      eventDate: submission.eventDate || null,
      locationDescription: submission.locationDescription || null,
      contributorDisplayName: anonymous
        ? "Identity protected"
        : submission.anonymityPreference === "SHOW_PSEUDONYM"
          ? submission.pseudonym || "Pseudonymous contributor"
          : submission.submittedBy?.name || "Contributor",
      contributorIsAnonymous: anonymous,
      verificationSummary: "Source context, contributor settings and privacy controls were reviewed by an authorised administrator.",
      verificationStatus: "SOURCE_CHECKED",
      sourceLabel: submission.sourceType === "FIRST_HAND" ? "Direct contributor" : submission.sourceType,
      status: "DRAFT",
      featured: false,
    });
  }

  return sendSuccess(res, {
    message: `Submission marked ${decision.label}.`,
    data: {
      submission: serializeSubmission(submission, { admin: true }),
      archiveItemId: archiveItem ? String(archiveItem._id) : null,
    },
  });
});

const listArchive = asyncHandler(async (_req, res) => {
  const items = await DocumentaryItem.find({ deletedAt: null })
    .populate("coverMediaId", "secureUrl url originalName mimeType fileSize")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
    .sort({ updatedAt: -1 });
  return sendSuccess(res, {
    message: "Archive publication queue retrieved successfully.",
    data: items.map(serializeAdminArchive),
  });
});

const publishArchive = asyncHandler(async (req, res) => {
  const filter = isObjectId(req.params.id)
    ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
    : { slug: req.params.id };
  const item = await DocumentaryItem.findOne({ ...filter, deletedAt: null });
  if (!item) throw new AppError("The requested archive item was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");

  const publish = String(req.body.status || "").toLowerCase() === "published";
  item.status = publish ? "PUBLISHED" : "HIDDEN";
  item.publishedAt = publish ? item.publishedAt || new Date() : null;
  item.publishedBy = publish ? req.userId : item.publishedBy;
  if (req.body.note?.trim()) item.verificationSummary = req.body.note.trim();
  await item.save();

  const mediaIds = [item.coverMediaId, ...(item.mediaIds || [])].filter(Boolean);
  if (mediaIds.length) {
    await MediaAsset.updateMany(
      { _id: { $in: mediaIds }, deletedAt: null },
      { $set: { visibility: publish ? "PUBLIC" : "PRIVATE", moderationStatus: publish ? "APPROVED" : "PENDING" } }
    );
  }
  if (item.eventId) {
    await JulyEvent.updateOne(
      { _id: item.eventId },
      {
        $set: publish
          ? { status: "PUBLISHED", publishedAt: new Date(), verifiedBy: req.userId }
          : { status: "VERIFIED", publishedAt: null },
      }
    );
  }
  if (item.sourceSubmissionId) {
    await DocumentarySubmission.updateOne(
      { _id: item.sourceSubmissionId },
      {
        $set: publish
          ? { status: "PUBLISHED", reviewLabel: "Published", publishedAt: new Date() }
          : { status: "VERIFIED", reviewLabel: "Approved", publishedAt: null },
      }
    );
  }

  await item.populate("coverMediaId", "secureUrl url originalName mimeType fileSize");
  await item.populate("mediaIds", "secureUrl url originalName mimeType fileSize");

  return sendSuccess(res, {
    message: publish ? "Archive item published successfully." : "Archive item removed from public publication.",
    data: serializeAdminArchive(item),
  });
});

module.exports = {
  dashboard,
  listSubmissions,
  reviewSubmission,
  listArchive,
  publishArchive,
  serializeAdminArchive,
};
