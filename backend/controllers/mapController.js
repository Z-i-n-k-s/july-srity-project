const mongoose = require("mongoose");
const DocumentaryItem = require("../models/documentaryItemModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { serializeArchive } = require("./frontendPublicController");
const {
  DIVISIONS,
  getDivision,
  divisionFromText,
  divisionDescriptionRegex,
  buildDivisionLocationIndex,
} = require("../helpers/divisionMap");

const MAX_LIMIT = 24;
const DEFAULT_LIMIT = 10;

const typeMap = {
  photo: ["IMAGE_GALLERY"],
  photograph: ["IMAGE_GALLERY"],
  video: ["VIDEO"],
  testimony: ["TESTIMONY", "STORY"],
  story: ["STORY", "TESTIMONY"],
  document: ["DOCUMENT"],
  doc: ["DOCUMENT"],
  audio: ["AUDIO"],
};

function parseLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const decoded = Buffer.from(String(value), "base64url").toString("utf8");
    const payload = JSON.parse(decoded);
    if (!mongoose.isValidObjectId(payload?.id)) return null;
    return payload;
  } catch (_error) {
    return null;
  }
}

function encodeCursor(item) {
  return Buffer.from(JSON.stringify({ id: String(item._id) }), "utf8").toString("base64url");
}

function buildLocationCondition(division, locationIndex) {
  const locationIds = Array.from(locationIndex.divisionToLocationIds.get(division.slug) || []);
  const conditions = [{ locationDescription: divisionDescriptionRegex(division) }];

  if (locationIds.length) {
    conditions.unshift({ locationId: { $in: locationIds } });
  }

  return { $or: conditions };
}

const summary = asyncHandler(async (_req, res) => {
  const locationIndex = await buildDivisionLocationIndex();

  const grouped = await DocumentaryItem.aggregate([
    {
      $match: {
        status: "PUBLISHED",
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: {
          locationId: "$locationId",
          locationDescription: "$locationDescription",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(DIVISIONS.map((division) => [division.slug, 0]));

  grouped.forEach((entry) => {
    const locationId = entry?._id?.locationId ? String(entry._id.locationId) : null;
    const byLocation = locationId
      ? locationIndex.locationToDivision.get(locationId)
      : null;
    const division = byLocation || divisionFromText(entry?._id?.locationDescription);

    if (division) {
      counts.set(division.slug, (counts.get(division.slug) || 0) + entry.count);
    }
  });

  const data = DIVISIONS.map((division) => ({
    id: division.slug,
    slug: division.slug,
    name: division.name,
    nameBn: division.nameBn,
    count: counts.get(division.slug) || 0,
    locationId: locationIndex.primaryDivisionIds.get(division.slug) || null,
  }));

  return sendSuccess(res, {
    message: "Bangladesh memory-map summary retrieved successfully.",
    data,
    meta: {
      total: data.reduce((sum, division) => sum + division.count, 0),
      divisions: data.length,
    },
  });
});

const listMemories = asyncHandler(async (req, res) => {
  const division = getDivision(req.params.division);
  if (!division) {
    throw new AppError("The requested Bangladesh division is not supported.", 404, "DIVISION_NOT_FOUND");
  }

  const limit = parseLimit(req.query.limit);
  const cursor = decodeCursor(req.query.cursor);
  const requestedType = String(req.query.type || "all").trim().toLowerCase();
  const contentTypes = typeMap[requestedType];
  const locationIndex = await buildDivisionLocationIndex();

  const baseConditions = [buildLocationCondition(division, locationIndex)];
  if (contentTypes) baseConditions.push({ contentType: { $in: contentTypes } });

  const baseQuery = {
    status: "PUBLISHED",
    deletedAt: null,
    $and: baseConditions,
  };

  const query = cursor
    ? {
        ...baseQuery,
        $and: [...baseConditions, { _id: { $lt: cursor.id } }],
      }
    : baseQuery;

  const [items, total] = await Promise.all([
    DocumentaryItem.find(query)
      .populate("coverMediaId", "secureUrl url originalName mimeType fileSize width height durationSeconds")
      .populate("locationId", "name nameBn type")
      .populate("tagIds", "name nameBn slug")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean(),
    DocumentaryItem.countDocuments(baseQuery),
  ]);

  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && pageItems.length
    ? encodeCursor(pageItems[pageItems.length - 1])
    : null;

  return sendSuccess(res, {
    message: `${division.name} memories retrieved successfully.`,
    data: pageItems.map(serializeArchive),
    meta: {
      division: {
        slug: division.slug,
        name: division.name,
        nameBn: division.nameBn,
      },
      total,
      limit,
      hasMore,
      nextCursor,
      type: requestedType,
    },
  });
});

module.exports = {
  summary,
  listMemories,
};
