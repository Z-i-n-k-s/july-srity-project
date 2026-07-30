const JulyEvent = require("../models/julyEventModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const DocumentarySubmission = require("../models/documentarySubmissionModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick, escapeRegex } = require("../helpers/query");
const { slugify } = require("../helpers/identifiers");
const { assertTransition } = require("../helpers/statusTransitions");
const { writeAudit } = require("../helpers/activity");
const { assertMediaAccessible, assertMediaPublishable } = require("../helpers/mediaValidation");

const editableFields = ["title", "titleBn", "slug", "summary", "description", "eventDate", "endDate", "locationId", "geoLocation", "eventType", "tagIds", "coverMediaId"];

const listPublic = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { status: "PUBLISHED" };
  if (req.query.eventType) filter.eventType = req.query.eventType;
  if (req.query.tagId) filter.tagIds = req.query.tagId;
  if (req.query.from || req.query.to) {
    filter.eventDate = {};
    if (req.query.from) filter.eventDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.eventDate.$lte = new Date(req.query.to);
  }
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ title: q }, { titleBn: q }, { summary: q }, { description: q }];
  }
  const [events, total] = await Promise.all([
    JulyEvent.find(filter)
      .populate("locationId", "name nameBn type")
      .populate("tagIds", "name nameBn slug")
      .populate({ path: "coverMediaId", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType" })
      .sort({ eventDate: -1 })
      .skip(skip).limit(limit),
    JulyEvent.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Published July events retrieved successfully.", data: events, meta: paginationMeta({ page, limit, total }) });
});

const getPublicBySlug = asyncHandler(async (req, res) => {
  const event = await JulyEvent.findOne({ slug: req.params.slug, status: "PUBLISHED" })
    .populate("locationId", "name nameBn type geoLocation")
    .populate("tagIds", "name nameBn slug")
    .populate({ path: "coverMediaId", match: { visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED", deletedAt: null }, select: "secureUrl url originalName fileType" });
  if (!event) throw new AppError("Published July event was not found.", 404, "EVENT_NOT_FOUND");
  return sendSuccess(res, { message: "July event retrieved successfully.", data: event });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const field of ["status", "eventType", "createdBy", "verifiedBy", "locationId"]) if (req.query[field]) filter[field] = req.query[field];
  const [events, total] = await Promise.all([
    JulyEvent.find(filter).populate("createdBy verifiedBy", "name email").sort({ eventDate: -1 }).skip(skip).limit(limit),
    JulyEvent.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "July events retrieved successfully.", data: events, meta: paginationMeta({ page, limit, total }) });
});

const create = asyncHandler(async (req, res) => {
  const payload = pick(req.body, editableFields);
  payload.slug = slugify(payload.slug || payload.title);
  payload.createdBy = req.userId;
  payload.status = "DRAFT";
  await assertMediaAccessible(payload.coverMediaId ? [payload.coverMediaId] : [], { admin: true });
  const event = await JulyEvent.create(payload);
  await writeAudit(req, { action: "CREATE", targetType: "JULY_EVENT", targetId: event._id, after: event.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "July event created as a draft.", data: event });
});

const getAdmin = asyncHandler(async (req, res) => {
  const event = await JulyEvent.findById(req.params.eventId).populate("createdBy verifiedBy", "name email");
  if (!event) throw new AppError("July event was not found.", 404, "EVENT_NOT_FOUND");
  return sendSuccess(res, { message: "July event retrieved successfully.", data: event });
});

const update = asyncHandler(async (req, res) => {
  const event = await JulyEvent.findById(req.params.eventId);
  if (!event) throw new AppError("July event was not found.", 404, "EVENT_NOT_FOUND");
  const before = event.toObject();
  const updates = pick(req.body, editableFields);
  if (updates.slug) updates.slug = slugify(updates.slug);
  const prospectiveCover = Object.prototype.hasOwnProperty.call(updates, "coverMediaId") ? updates.coverMediaId : event.coverMediaId;
  if (event.status === "PUBLISHED") await assertMediaPublishable(prospectiveCover ? [prospectiveCover] : []);
  else await assertMediaAccessible(prospectiveCover ? [prospectiveCover] : [], { admin: true });
  Object.assign(event, updates);
  await event.save();
  await writeAudit(req, { action: "UPDATE", targetType: "JULY_EVENT", targetId: event._id, before, after: event.toObject() });
  return sendSuccess(res, { message: "July event updated successfully.", data: event });
});

const changeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const event = await JulyEvent.findById(req.params.eventId);
  if (!event) throw new AppError("July event was not found.", 404, "EVENT_NOT_FOUND");
  assertTransition("JULY_EVENT", event.status, status);
  const before = event.toObject();
  event.status = status;
  if (status === "VERIFIED") event.verifiedBy = req.userId;
  if (status === "PUBLISHED") {
    await assertMediaPublishable(event.coverMediaId ? [event.coverMediaId] : []);
    event.publishedAt = new Date();
  }
  if (status !== "PUBLISHED" && event.status !== "PUBLISHED") event.publishedAt = event.publishedAt || null;
  await event.save();
  await writeAudit(req, { action: status === "PUBLISHED" ? "PUBLISH" : "CHANGE_STATUS", targetType: "JULY_EVENT", targetId: event._id, before, after: event.toObject() });
  return sendSuccess(res, { message: `July event status changed to ${status}.`, data: event });
});

const remove = asyncHandler(async (req, res) => {
  const event = await JulyEvent.findById(req.params.eventId);
  if (!event) throw new AppError("July event was not found.", 404, "EVENT_NOT_FOUND");
  if (event.status === "PUBLISHED") throw new AppError("Published events must be archived before deletion.", 422, "PUBLISHED_EVENT_DELETE_BLOCKED");
  const references = await Promise.all([
    DocumentaryItem.exists({ eventId: event._id, deletedAt: null }),
    DocumentarySubmission.exists({ eventId: event._id, deletedAt: null }),
    MissingPersonReport.exists({ relatedJulyEventId: event._id, deletedAt: null }),
  ]);
  if (references.some(Boolean)) throw new AppError("This event is referenced by another record and cannot be deleted. Archive it instead.", 409, "EVENT_IN_USE");
  await event.deleteOne();
  await writeAudit(req, { action: "DELETE", targetType: "JULY_EVENT", targetId: event._id, before: event.toObject() });
  return sendSuccess(res, { message: "July event deleted successfully.", data: null });
});

module.exports = { listPublic, getPublicBySlug, listAdmin, create, getAdmin, update, changeStatus, remove };
