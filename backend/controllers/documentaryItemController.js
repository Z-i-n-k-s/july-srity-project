const DocumentaryItem = require("../models/documentaryItemModel");
const DocumentarySubmission = require("../models/documentarySubmissionModel");
const DocumentaryVersion = require("../models/documentaryVersionModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { slugify } = require("../helpers/identifiers");
const { assertTransition } = require("../helpers/statusTransitions");
const { createNotification, writeAudit } = require("../helpers/activity");
const { uniqueIds, assertMediaAccessible, assertMediaPublishable } = require("../helpers/mediaValidation");

const editableFields = [
  "contentType", "title", "titleBn", "slug", "summary", "body", "coverMediaId", "mediaIds",
  "eventId", "eventDate", "locationId", "tagIds", "contributorDisplayName", "contributorIsAnonymous",
  "verificationSummary", "verificationStatus", "sourceLabel", "sensitivityLevel", "contentWarning", "featured",
];

async function validateItemMedia(payload, { published = false } = {}) {
  const mediaIds = uniqueIds([payload.coverMediaId, ...(payload.mediaIds || [])]);
  if (published) return assertMediaPublishable(mediaIds);
  return assertMediaAccessible(mediaIds, { admin: true });
}

function assertPublicationMetadata(item) {
  if (!item.verificationSummary?.trim()) {
    throw new AppError("A public verification summary is required before publishing.", 422, "VERIFICATION_SUMMARY_REQUIRED");
  }
  if (!item.sourceLabel?.trim()) {
    throw new AppError("A public source label is required before publishing.", 422, "SOURCE_LABEL_REQUIRED");
  }
  if (item.sensitivityLevel !== "NONE" && !item.contentWarning?.trim()) {
    throw new AppError("Sensitive or graphic records require a public content warning.", 422, "CONTENT_WARNING_REQUIRED");
  }
}

function publicPopulate(query) {
  return query
    .populate({ path: "coverMediaId", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType sensitivityLevel" })
    .populate({ path: "mediaIds", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType sensitivityLevel" })
    .populate("eventId", "title titleBn slug eventDate")
    .populate("locationId", "name nameBn type")
    .populate("tagIds", "name nameBn slug");
}

const listPublic = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "PUBLISHED", deletedAt: null };
  for (const field of ["contentType", "eventId", "locationId", "verificationStatus", "sensitivityLevel"]) if (req.query[field]) filter[field] = req.query[field];
  if (req.query.featured === "true") filter.featured = true;
  if (req.query.tagId) filter.tagIds = req.query.tagId;
  if (req.query.q) filter.$text = { $search: req.query.q };
  const sort = req.query.sort === "popular" ? { viewCount: -1, publishedAt: -1 } : { featured: -1, publishedAt: -1 };

  let query = DocumentaryItem.find(filter).sort(sort).skip(skip).limit(limit);
  query = publicPopulate(query);
  const [items, total] = await Promise.all([query, DocumentaryItem.countDocuments(filter)]);
  // AFTER
res.set('Cache-Control', 'no-store');
return sendSuccess(res, { message: "Published archive records retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const getPublicBySlug = asyncHandler(async (req, res) => {
  let query = DocumentaryItem.findOneAndUpdate(
    { slug: req.params.slug, status: "PUBLISHED", deletedAt: null },
    { $inc: { viewCount: 1 } },
    { new: true }
  );
  query = publicPopulate(query);
  const item = await query;
  if (!item) throw new AppError("Published archive record was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");
  return sendSuccess(res, { message: "Archive record retrieved successfully.", data: item });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };
  for (const field of ["status", "contentType", "featured", "verificationStatus", "sourceSubmissionId"]) if (req.query[field] !== undefined) filter[field] = req.query[field];
  const [items, total] = await Promise.all([
    DocumentaryItem.find(filter).populate("publishedBy", "name email").sort({ updatedAt: -1 }).skip(skip).limit(limit),
    DocumentaryItem.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Archive records retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const createFromSubmission = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Documentary submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  if (submission.status !== "VERIFIED") throw new AppError("Only verified submissions can become public archive records.", 422, "SUBMISSION_NOT_VERIFIED");
  if (submission.submissionType === "CORRECTION") {
    throw new AppError("Use the apply-correction endpoint for verified correction submissions.", 422, "USE_CORRECTION_WORKFLOW");
  }
  const existing = await DocumentaryItem.findOne({ sourceSubmissionId: submission._id, deletedAt: null });
  if (existing) throw new AppError("An archive item already exists for this submission.", 409, "ARCHIVE_ITEM_ALREADY_EXISTS");

  const overrides = pick(req.body, editableFields);
  await validateItemMedia({
    coverMediaId: overrides.coverMediaId || submission.mediaIds?.[0] || null,
    mediaIds: overrides.mediaIds || submission.mediaIds || [],
  });
  const item = await DocumentaryItem.create({
    sourceSubmissionId: submission._id,
    contentType: overrides.contentType || (submission.submissionType === "IMAGE" ? "IMAGE_GALLERY" : submission.submissionType === "TESTIMONY" ? "TESTIMONY" : submission.submissionType),
    title: overrides.title || submission.title,
    titleBn: overrides.titleBn || null,
    slug: slugify(overrides.slug || submission.title),
    summary: overrides.summary || submission.description,
    body: overrides.body || submission.storyContent,
    coverMediaId: overrides.coverMediaId || submission.mediaIds?.[0] || null,
    mediaIds: overrides.mediaIds || submission.mediaIds,
    eventId: overrides.eventId || submission.eventId,
    eventDate: overrides.eventDate || submission.eventDate,
    locationId: overrides.locationId || submission.locationId,
    tagIds: overrides.tagIds || submission.tagIds,
    contributorDisplayName: overrides.contributorDisplayName || (submission.anonymityPreference === "SHOW_PSEUDONYM" ? submission.pseudonym : null),
    contributorIsAnonymous: overrides.contributorIsAnonymous ?? submission.anonymityPreference !== "SHOW_NAME",
    verificationSummary: overrides.verificationSummary || null,
    verificationStatus: overrides.verificationStatus || "SOURCE_CHECKED",
    sourceLabel: overrides.sourceLabel || (submission.sourceType === "FIRST_HAND" ? "Direct contributor" : submission.sourceType.replaceAll("_", " ")),
    sensitivityLevel: overrides.sensitivityLevel || "NONE",
    contentWarning: overrides.contentWarning || null,
    featured: overrides.featured || false,
    status: "DRAFT",
  });

  await writeAudit(req, { action: "CREATE", targetType: "DOCUMENTARY_ITEM", targetId: item._id, after: item.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "Archive item created as a draft.", data: item });
});

const create = asyncHandler(async (req, res) => {
  const payload = pick(req.body, [...editableFields, "sourceSubmissionId"]);
  payload.slug = slugify(payload.slug || payload.title);
  payload.status = "DRAFT";
  await validateItemMedia(payload);
  const item = await DocumentaryItem.create(payload);
  await writeAudit(req, { action: "CREATE", targetType: "DOCUMENTARY_ITEM", targetId: item._id, after: item.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "Archive item created as a draft.", data: item });
});

const getAdmin = asyncHandler(async (req, res) => {
  const item = await DocumentaryItem.findOne({ _id: req.params.itemId, deletedAt: null })
    .populate("sourceSubmissionId").populate("publishedBy", "name email");
  if (!item) throw new AppError("Archive item was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");
  return sendSuccess(res, { message: "Archive item retrieved successfully.", data: item });
});

const update = asyncHandler(async (req, res) => {
  const item = await DocumentaryItem.findOne({ _id: req.params.itemId, deletedAt: null });
  if (!item) throw new AppError("Archive item was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");
  const before = item.toObject();
  const latestVersion = await DocumentaryVersion.findOne({ documentaryItemId: item._id }).sort({ versionNumber: -1 });
  await DocumentaryVersion.create({
    documentaryItemId: item._id,
    versionNumber: (latestVersion?.versionNumber || 0) + 1,
    title: item.title,
    titleBn: item.titleBn,
    slug: item.slug,
    contentType: item.contentType,
    summary: item.summary,
    body: item.body,
    coverMediaId: item.coverMediaId,
    mediaIds: item.mediaIds,
    eventId: item.eventId,
    eventDate: item.eventDate,
    locationId: item.locationId,
    tagIds: item.tagIds,
    contributorDisplayName: item.contributorDisplayName,
    contributorIsAnonymous: item.contributorIsAnonymous,
    verificationSummary: item.verificationSummary,
    verificationStatus: item.verificationStatus,
    sourceLabel: item.sourceLabel,
    sensitivityLevel: item.sensitivityLevel,
    contentWarning: item.contentWarning,
    featured: item.featured,
    status: item.status,
    changeReason: req.body.changeReason || "Editorial update",
    editedBy: req.userId,
  });

  const updates = pick(req.body, editableFields);
  if (updates.slug) updates.slug = slugify(updates.slug);
  const prospective = { ...item.toObject(), ...updates };
  await validateItemMedia(prospective, { published: item.status === "PUBLISHED" });
  if (item.status === "PUBLISHED") assertPublicationMetadata(prospective);
  Object.assign(item, updates);
  await item.save();
  await writeAudit(req, { action: "UPDATE", targetType: "DOCUMENTARY_ITEM", targetId: item._id, before, after: item.toObject() });
  return sendSuccess(res, { message: "Archive item updated successfully and the previous version was preserved.", data: item });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const item = await DocumentaryItem.findOne({ _id: req.params.itemId, deletedAt: null });
  if (!item) throw new AppError("Archive item was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");
  assertTransition("DOCUMENTARY_ITEM", item.status, status);
  const before = item.toObject();
  item.status = status;
  if (status === "PUBLISHED") {
    assertPublicationMetadata(item);
    await validateItemMedia(item, { published: true });
    item.publishedBy = req.userId;
    item.publishedAt = new Date();
  }
  await item.save();
  if (item.sourceSubmissionId && status === "PUBLISHED") {
    const submission = await DocumentarySubmission.findByIdAndUpdate(item.sourceSubmissionId, { status: "PUBLISHED", publishedAt: new Date() }, { new: true });
    if (submission) await createNotification({
      userId: submission.submittedBy,
      type: "SUBMISSION_APPROVED",
      title: "Your archive contribution was published",
      message: `${item.title} is now available in the July Archive.`,
      entityType: "DOCUMENTARY_ITEM",
      entityId: item._id,
    });
  }
  await writeAudit(req, { action: status === "PUBLISHED" ? "PUBLISH" : status === "HIDDEN" ? "UNPUBLISH" : "CHANGE_STATUS", targetType: "DOCUMENTARY_ITEM", targetId: item._id, before, after: item.toObject() });
  return sendSuccess(res, { message: `Archive item status changed to ${status}.`, data: item });
});

const listVersions = asyncHandler(async (req, res) => {
  const versions = await DocumentaryVersion.find({ documentaryItemId: req.params.itemId })
    .populate("editedBy", "name email")
    .sort({ versionNumber: -1 });
  return sendSuccess(res, { message: "Archive item versions retrieved successfully.", data: versions });
});

const applyCorrection = asyncHandler(async (req, res) => {
  const submission = await DocumentarySubmission.findOne({ _id: req.params.submissionId, deletedAt: null });
  if (!submission) throw new AppError("Correction submission was not found.", 404, "SUBMISSION_NOT_FOUND");
  if (submission.submissionType !== "CORRECTION") throw new AppError("This submission is not a correction request.", 422, "NOT_A_CORRECTION_SUBMISSION");
  if (submission.status !== "VERIFIED") throw new AppError("Only verified correction submissions can be applied.", 422, "CORRECTION_NOT_VERIFIED");
  if (!submission.correctionTargetItemId) throw new AppError("The correction submission does not identify a target archive item.", 422, "CORRECTION_TARGET_REQUIRED");

  const item = await DocumentaryItem.findOne({ _id: submission.correctionTargetItemId, deletedAt: null });
  if (!item) throw new AppError("The correction target archive item was not found.", 404, "CORRECTION_TARGET_NOT_FOUND");

  const latestVersion = await DocumentaryVersion.findOne({ documentaryItemId: item._id }).sort({ versionNumber: -1 });
  await DocumentaryVersion.create({
    documentaryItemId: item._id,
    versionNumber: (latestVersion?.versionNumber || 0) + 1,
    title: item.title,
    titleBn: item.titleBn,
    slug: item.slug,
    contentType: item.contentType,
    summary: item.summary,
    body: item.body,
    coverMediaId: item.coverMediaId,
    mediaIds: item.mediaIds,
    eventId: item.eventId,
    eventDate: item.eventDate,
    locationId: item.locationId,
    tagIds: item.tagIds,
    contributorDisplayName: item.contributorDisplayName,
    contributorIsAnonymous: item.contributorIsAnonymous,
    verificationSummary: item.verificationSummary,
    verificationStatus: item.verificationStatus,
    sourceLabel: item.sourceLabel,
    sensitivityLevel: item.sensitivityLevel,
    contentWarning: item.contentWarning,
    featured: item.featured,
    status: item.status,
    changeReason: submission.correctionReason || "Verified public correction",
    editedBy: req.userId,
  });

  const allowedCorrectionFields = pick(req.body, [
    "title", "titleBn", "summary", "body", "coverMediaId", "mediaIds", "eventId", "eventDate",
    "locationId", "tagIds", "verificationSummary", "verificationStatus", "sourceLabel",
    "sensitivityLevel", "contentWarning",
  ]);
  const prospective = { ...item.toObject(), ...allowedCorrectionFields };
  await validateItemMedia(prospective, { published: item.status === "PUBLISHED" });
  if (item.status === "PUBLISHED") assertPublicationMetadata(prospective);
  Object.assign(item, allowedCorrectionFields);
  await item.save();

  submission.status = "PUBLISHED";
  submission.publishedAt = new Date();
  await submission.save();

  await createNotification({
    userId: submission.submittedBy,
    type: "SUBMISSION_APPROVED",
    title: "Correction published",
    message: `Your verified correction for ${item.title} was applied.`,
    entityType: "DOCUMENTARY_ITEM",
    entityId: item._id,
  });
  await writeAudit(req, { action: "UPDATE", targetType: "DOCUMENTARY_ITEM", targetId: item._id, after: { correctionSubmissionId: submission._id } });
  return sendSuccess(res, { message: "Verified correction applied and version history preserved.", data: { item, submission } });
});

const remove = asyncHandler(async (req, res) => {
  const item = await DocumentaryItem.findOne({ _id: req.params.itemId, deletedAt: null });
  if (!item) throw new AppError("Archive item was not found.", 404, "ARCHIVE_ITEM_NOT_FOUND");
  if (item.status === "PUBLISHED") throw new AppError("Hide or archive the item before deleting it.", 422, "PUBLISHED_ITEM_DELETE_BLOCKED");
  item.deletedAt = new Date();
  await item.save({ validateBeforeSave: false });
  await writeAudit(req, { action: "DELETE", targetType: "DOCUMENTARY_ITEM", targetId: item._id, before: item.toObject() });
  return sendSuccess(res, { message: "Archive item deleted successfully.", data: null });
});

module.exports = { listPublic, getPublicBySlug, listAdmin, createFromSubmission, applyCorrection, create, getAdmin, update, changeStatus, listVersions, remove };
