const crypto = require("crypto");
const { Readable } = require("stream");
const MediaAsset = require("../models/mediaAssetModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const JulyEvent = require("../models/julyEventModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { configureCloudinary } = require("../config/cloudinary");
const { requireOwnerOrAdmin, isAdmin } = require("../helpers/access");
const { writeAudit } = require("../helpers/activity");

function inferFileType(mimeType) {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf") return "PDF";
  return "DOCUMENT";
}

async function hasPublicReference(mediaId) {
  const [archiveItem, event, missingReport] = await Promise.all([
    DocumentaryItem.exists({ status: "PUBLISHED", deletedAt: null, $or: [{ coverMediaId: mediaId }, { mediaIds: mediaId }] }),
    JulyEvent.exists({ status: "PUBLISHED", coverMediaId: mediaId }),
    MissingPersonReport.exists({ status: "VERIFIED_MISSING", deletedAt: null, profileMediaId: mediaId }),
  ]);
  return Boolean(archiveItem || event || missingReport);
}

function uploadBuffer(cloudinary, file, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    Readable.from(file.buffer).pipe(stream);
  });
}

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("Attach one file using the multipart field named 'file'.", 422, "FILE_REQUIRED");
  const cloudinary = configureCloudinary();
  const checksum = crypto.createHash("sha256").update(req.file.buffer).digest("hex");
  const resourceType = req.file.mimetype.startsWith("video/") || req.file.mimetype.startsWith("audio/") ? "video" : req.file.mimetype === "application/pdf" || req.file.mimetype.startsWith("application/") || req.file.mimetype.startsWith("text/") ? "raw" : "image";

  let uploaded;
  try {
    uploaded = await uploadBuffer(cloudinary, req.file, {
      resource_type: resourceType,
      folder: process.env.CLOUDINARY_FOLDER || "july-smriti",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
  } catch (error) {
    throw new AppError(`Cloudinary upload failed: ${error.message}`, 502, "CLOUDINARY_UPLOAD_FAILED");
  }

  const media = await MediaAsset.create({
    uploadedBy: req.userId,
    storageProvider: "CLOUDINARY",
    storageKey: uploaded.public_id,
    url: uploaded.url || null,
    secureUrl: uploaded.secure_url || null,
    originalName: req.file.originalname,
    fileType: inferFileType(req.file.mimetype),
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    width: uploaded.width || null,
    height: uploaded.height || null,
    durationSeconds: uploaded.duration || null,
    visibility: req.body.visibility || "PRIVATE",
    uploadStatus: "READY",
    moderationStatus: isAdmin(req) ? "APPROVED" : "PENDING",
    sensitivityLevel: req.body.sensitivityLevel || "NONE",
    checksum,
  });

  await writeAudit(req, { action: "CREATE", targetType: "MEDIA_ASSET", targetId: media._id, after: media.toObject() });
  return sendSuccess(res, { statusCode: 201, message: "File uploaded successfully.", data: media });
});

const listMyMedia = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { uploadedBy: req.userId, deletedAt: null };
  if (req.query.fileType) filter.fileType = req.query.fileType;
  if (req.query.uploadStatus) filter.uploadStatus = req.query.uploadStatus;
  const [items, total] = await Promise.all([
    MediaAsset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    MediaAsset.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Your media files were retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const listAllMedia = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: null };
  for (const field of ["fileType", "visibility", "uploadStatus", "moderationStatus", "sensitivityLevel", "uploadedBy"]) {
    if (req.query[field]) filter[field] = req.query[field];
  }
  const [items, total] = await Promise.all([
    MediaAsset.find(filter).populate("uploadedBy", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit),
    MediaAsset.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Media files retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const getMedia = asyncHandler(async (req, res) => {
  const media = await MediaAsset.findOne({ _id: req.params.mediaId, deletedAt: null });
  if (!media) throw new AppError("Media file was not found.", 404, "MEDIA_NOT_FOUND");
  const safelyPublic = media.visibility === "PUBLIC"
    && media.uploadStatus === "READY"
    && media.moderationStatus === "APPROVED";
  if (!safelyPublic) requireOwnerOrAdmin(req, media, ["uploadedBy"]);
  return sendSuccess(res, { message: "Media metadata retrieved successfully.", data: media });
});

const updateMedia = asyncHandler(async (req, res) => {
  const media = await MediaAsset.findOne({ _id: req.params.mediaId, deletedAt: null });
  if (!media) throw new AppError("Media file was not found.", 404, "MEDIA_NOT_FOUND");
  requireOwnerOrAdmin(req, media, ["uploadedBy"]);
  const before = media.toObject();
  const allowed = isAdmin(req)
    ? ["visibility", "moderationStatus", "uploadStatus", "sensitivityLevel", "thumbnailMediaId"]
    : ["visibility", "sensitivityLevel", "thumbnailMediaId"];
  const updates = pick(req.body, allowed);
  if (await hasPublicReference(media._id)) {
    const wouldStopPublication =
      (updates.visibility && updates.visibility !== "PUBLIC") ||
      (updates.moderationStatus && updates.moderationStatus !== "APPROVED") ||
      (updates.uploadStatus && updates.uploadStatus !== "READY");
    if (wouldStopPublication) {
      throw new AppError("This media file is used by a public record. Hide or update the public record before restricting the media.", 409, "MEDIA_HAS_PUBLIC_REFERENCE");
    }
  }
  Object.assign(media, updates);
  await media.save();
  await writeAudit(req, { action: "UPDATE", targetType: "MEDIA_ASSET", targetId: media._id, before, after: media.toObject() });
  return sendSuccess(res, { message: "Media metadata updated successfully.", data: media });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const media = await MediaAsset.findOne({ _id: req.params.mediaId, deletedAt: null });
  if (!media) throw new AppError("Media file was not found.", 404, "MEDIA_NOT_FOUND");
  requireOwnerOrAdmin(req, media, ["uploadedBy"]);
  if (await hasPublicReference(media._id)) {
    throw new AppError("This media file is used by a public record and cannot be deleted until that record is hidden or updated.", 409, "MEDIA_HAS_PUBLIC_REFERENCE");
  }

  try {
    const cloudinary = configureCloudinary();
    const resourceType = media.fileType === "VIDEO" || media.fileType === "AUDIO" ? "video" : ["PDF", "DOCUMENT"].includes(media.fileType) ? "raw" : "image";
    await cloudinary.uploader.destroy(media.storageKey, { resource_type: resourceType, invalidate: true });
  } catch (error) {
    console.error("Cloudinary deletion warning:", error.message);
  }

  media.deletedAt = new Date();
  await media.save({ validateBeforeSave: false });
  await writeAudit(req, { action: "DELETE", targetType: "MEDIA_ASSET", targetId: media._id, before: media.toObject() });
  return sendSuccess(res, { message: "Media file deleted successfully.", data: null });
});

module.exports = { uploadMedia, listMyMedia, listAllMedia, getMedia, updateMedia, deleteMedia };
