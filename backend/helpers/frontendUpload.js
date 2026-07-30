const fs = require("fs");
const crypto = require("crypto");
const { configureCloudinary } = require("../config/cloudinary");


const MediaAsset = require("../models/mediaAssetModel");
const AppError = require("./AppError");

function fileTypeFromMime(mimeType = "") {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf") return "PDF";
  return "DOCUMENT";
}


function cloudinaryResourceType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) return "video";
  return "raw";
}

function uploadOptions(file, { folder, publicId } = {}) {
  return {
    folder: folder || process.env.CLOUDINARY_UPLOAD_FOLDER || "july-smriti",
    public_id: publicId,
    resource_type: cloudinaryResourceType(file.mimetype),
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };
}

async function uploadBuffer(file, options) {
  const cloudinary = configureCloudinary();

  try {
    const ping = await cloudinary.api.ping();
    console.log("Cloudinary Ping:", ping);
  } catch (err) {
    console.error("Cloudinary Ping Failed:", err);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions(file, options),
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

function uploadPath(file, options) {
  const cloudinary = configureCloudinary();
  const largeThreshold = 100 * 1024 * 1024;
  const method = file.size > largeThreshold ? "upload_large" : "upload";

  return new Promise((resolve, reject) => {
    cloudinary.uploader[method](
      file.path,
      uploadOptions(file, options),
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
  });
}

async function checksumForFile(file) {
  if (file.buffer) {
    return crypto.createHash("sha256").update(file.buffer).digest("hex");
  }
  if (!file.path) {
    throw new AppError("The uploaded file data is missing.", 400, "FILE_DATA_MISSING");
  }

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(file.path);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function removeTemporaryFile(file) {
  if (!file?.path) return;
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") console.error(`Could not remove temporary upload ${file.path}:`, error.message);
  }
}

async function saveUploadedFile(file, {
  userId,
  folder,
  visibility = "PRIVATE",
  moderationStatus = "PENDING",
} = {}) {
  if (!file?.buffer && !file?.path) {
    throw new AppError("The uploaded file data is missing.", 400, "FILE_DATA_MISSING");
  }

  let result;
  try {
    const checksum = await checksumForFile(file);
    result = file.path
      ? await uploadPath(file, { folder })
      : await uploadBuffer(file, { folder });

    return await MediaAsset.create({
      uploadedBy: userId,
      storageProvider: "CLOUDINARY",
      storageKey: result.public_id,
      url: result.url || null,
      secureUrl: result.secure_url || result.url || null,
      originalName: file.originalname,
      fileType: fileTypeFromMime(file.mimetype),
      mimeType: file.mimetype || "application/octet-stream",
      fileSize: file.size || file.buffer?.length || 0,
      width: result.width || null,
      height: result.height || null,
      durationSeconds: result.duration || null,
      visibility,
      uploadStatus: "READY",
      moderationStatus,
      checksum,
    });
  } catch (error) {
    if (result?.public_id) {
      try {
        const cloudinary = configureCloudinary();
        await cloudinary.uploader.destroy(result.public_id, {
          resource_type: cloudinaryResourceType(file.mimetype),
          invalidate: true,
        });
      } catch (_cleanupError) {
        // Preserve the original upload/database error.
      }
    }

    if (error instanceof AppError) throw error;
    throw new AppError(
      `Cloudinary could not upload ${file.originalname || "the selected file"}.`,
      502,
      "CLOUDINARY_UPLOAD_FAILED",
      { originalName: file.originalname, reason: error.message }
    );
  } finally {
    await removeTemporaryFile(file);
  }
}

async function saveUploadedFiles(files = [], options = {}) {
  const saved = [];
  try {
    for (const file of files) {
      saved.push(await saveUploadedFile(file, options));
    }
    return saved;
  } finally {
    // Remove files that were accepted by Multer but were not reached after an earlier failure.
    await Promise.all(files.map(removeTemporaryFile));
  }
}

module.exports = {
  fileTypeFromMime,
  saveUploadedFile,
  saveUploadedFiles,
  removeTemporaryFile,
};
