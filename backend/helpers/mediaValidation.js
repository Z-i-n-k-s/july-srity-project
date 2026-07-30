const MediaAsset = require("../models/mediaAssetModel");
const AppError = require("./AppError");

function uniqueIds(values = []) {
  return [...new Set((Array.isArray(values) ? values : [values]).filter(Boolean).map(String))];
}

async function assertMediaAccessible(ids, { userId, admin = false, allowPublic = true } = {}) {
  const unique = uniqueIds(ids);
  if (!unique.length) return [];

  const filter = { _id: { $in: unique }, deletedAt: null };
  if (!admin) {
    filter.$or = [{ uploadedBy: userId }];
    if (allowPublic) filter.$or.push({ visibility: "PUBLIC", uploadStatus: "READY", moderationStatus: "APPROVED" });
  }

  const media = await MediaAsset.find(filter).select("_id uploadedBy visibility uploadStatus moderationStatus fileType");
  if (media.length !== unique.length) {
    throw new AppError(
      "One or more media IDs do not exist or are not accessible to this account.",
      422,
      "MEDIA_ACCESS_DENIED",
      { requestedCount: unique.length, accessibleCount: media.length }
    );
  }
  return media;
}

async function assertMediaPublishable(ids) {
  const unique = uniqueIds(ids);
  if (!unique.length) return [];
  const media = await MediaAsset.find({
    _id: { $in: unique },
    visibility: "PUBLIC",
    uploadStatus: "READY",
    moderationStatus: "APPROVED",
    deletedAt: null,
  }).select("_id");

  if (media.length !== unique.length) {
    throw new AppError(
      "Every attached media file must be READY, APPROVED, PUBLIC, and not deleted before publication.",
      422,
      "MEDIA_NOT_PUBLISHABLE",
      { requestedCount: unique.length, publishableCount: media.length }
    );
  }
  return media;
}

module.exports = { uniqueIds, assertMediaAccessible, assertMediaPublishable };
