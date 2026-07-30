const DocumentaryItem = require("../models/documentaryItemModel");
const JulyEvent = require("../models/julyEventModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const {
  formatDate,
  mediaUrl,
  verificationLabel,
  archiveType,
  isObjectId,
} = require("../helpers/frontendCompatibility");

function archiveQuery(id) {
  const query = { deletedAt: null, status: "PUBLISHED" };
  if (isObjectId(id)) query.$or = [{ _id: id }, { slug: id }];
  else query.slug = id;
  return query;
}

function serializeArchive(item) {
  const cover = item.coverMediaId || (Array.isArray(item.mediaIds) ? item.mediaIds[0] : null);
  const location = item.locationId?.name || item.locationId?.nameBn || item.locationDescription || "Approximate location protected";
  const verification = verificationLabel(item.verificationStatus);

  return {
    id: item.slug || String(item._id),
    _id: String(item._id),
    type: archiveType(item.contentType),
    verified: ["SOURCE_CHECKED", "PARTIALLY_VERIFIED", "CORROBORATED"].includes(item.verificationStatus),
    status: verification,
    title: item.titleBn || item.title,
    titleEn: item.title,
    description: item.summary || item.body || "",
    summary: item.summary || "",
    body: item.body || "",
    date: formatDate(item.eventDate || item.publishedAt),
    eventDate: item.eventDate || null,
    location,
    contributor: item.contributorIsAnonymous
      ? "Identity protected"
      : item.contributorDisplayName || "Contributor",
    attribution: item.contributorIsAnonymous
      ? "Identity protected"
      : item.contributorDisplayName || "Contributor",
    image: mediaUrl(cover),
    thumbnail: mediaUrl(cover),
    tags: (item.tagIds || []).map((tag) => tag.nameBn || tag.name || tag.slug).filter(Boolean),
    verificationNote: item.verificationSummary || `${verification}. Source context and privacy were reviewed before publication.`,
    source: item.sourceLabel || "Protected contributor record",
    sensitive: item.sensitivityLevel && item.sensitivityLevel !== "NONE",
    contentWarning: item.contentWarning || null,
  };
}

function serializeStory(item) {
  const archive = serializeArchive(item);
  const body = item.body || item.summary || "";
  const quote = (item.summary || body).replace(/\s+/g, " ").trim().slice(0, 220);

  return {
    id: archive.id,
    _id: archive._id,
    name: archive.contributor,
    attribution: archive.attribution,
    quote: quote || item.title,
    title: item.titleBn || item.title,
    location: archive.location,
    category: archive.type,
    image: archive.image,
    thumbnail: archive.thumbnail,
    featured: Boolean(item.featured),
    body,
    description: body,
    status: archive.status,
  };
}

const listArchive = asyncHandler(async (_req, res) => {
  const items = await DocumentaryItem.find({ status: "PUBLISHED", deletedAt: null })
    .populate("coverMediaId", "secureUrl url originalName mimeType fileSize")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
    .populate("locationId", "name nameBn")
    .populate("tagIds", "name nameBn slug")
    .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Published archive records retrieved successfully.",
    data: items.map(serializeArchive),
  });
});

const getArchive = asyncHandler(async (req, res) => {
  const item = await DocumentaryItem.findOne(archiveQuery(req.params.id))
    .populate("coverMediaId", "secureUrl url originalName mimeType fileSize")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
    .populate("locationId", "name nameBn")
    .populate("tagIds", "name nameBn slug")
    .lean();

  if (!item) throw new AppError("The requested archive record was not found.", 404, "ARCHIVE_RECORD_NOT_FOUND");
  await DocumentaryItem.updateOne({ _id: item._id }, { $inc: { viewCount: 1 } });

  return sendSuccess(res, {
    message: "Archive record retrieved successfully.",
    data: serializeArchive(item),
  });
});

const listStories = asyncHandler(async (_req, res) => {
  const items = await DocumentaryItem.find({
    status: "PUBLISHED",
    deletedAt: null,
    contentType: { $in: ["STORY", "TESTIMONY"] },
  })
    .populate("coverMediaId", "secureUrl url originalName mimeType fileSize")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
    .populate("locationId", "name nameBn")
    .sort({ featured: -1, publishedAt: -1 })
    .lean();

  return sendSuccess(res, {
    message: "Published stories retrieved successfully.",
    data: items.map(serializeStory),
  });
});

const getStory = asyncHandler(async (req, res) => {
  const query = archiveQuery(req.params.id);
  query.contentType = { $in: ["STORY", "TESTIMONY"] };
  const item = await DocumentaryItem.findOne(query)
    .populate("coverMediaId", "secureUrl url originalName mimeType fileSize")
    .populate("mediaIds", "secureUrl url originalName mimeType fileSize")
    .populate("locationId", "name nameBn")
    .lean();

  if (!item) throw new AppError("The requested story was not found.", 404, "STORY_NOT_FOUND");
  await DocumentaryItem.updateOne({ _id: item._id }, { $inc: { viewCount: 1 } });

  return sendSuccess(res, {
    message: "Story retrieved successfully.",
    data: serializeStory(item),
  });
});

const listTimeline = asyncHandler(async (_req, res) => {
  const events = await JulyEvent.find({ status: "PUBLISHED" })
    .populate("locationId", "name nameBn")
    .sort({ eventDate: 1 })
    .lean();

  const eventIds = events.map((item) => item._id);
  const counts = await DocumentaryItem.aggregate([
    { $match: { eventId: { $in: eventIds }, status: "PUBLISHED", deletedAt: null } },
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [String(item._id), item.count]));

  const data = events.map((event) => ({
    id: event.slug || String(event._id),
    _id: String(event._id),
    date: new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short" }).format(new Date(event.eventDate)),
    year: new Date(event.eventDate).getFullYear(),
    title: event.titleBn || event.title,
    location:
      event.locationId?.nameBn ||
      event.locationId?.name ||
      event.locationDescription ||
      "Location not specified",
    summary: event.summary || event.description || "",
    mediaCount: countMap.get(String(event._id)) || 0,
    recordCount: countMap.get(String(event._id)) || 0,
    verified: true,
  }));

  return sendSuccess(res, {
    message: "Published July timeline retrieved successfully.",
    data,
  });
});

module.exports = {
  listArchive,
  getArchive,
  listStories,
  getStory,
  listTimeline,
  serializeArchive,
  serializeStory,
};
