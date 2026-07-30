const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const AppError = require("../helpers/AppError");

const uploadDirectory = path.join(os.tmpdir(), "july-smriti-uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const diskStorage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, uploadDirectory);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname || "").slice(0, 16);
    callback(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${extension}`);
  },
});

function allowedEvidenceMime(mime = "") {
  return (
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime.startsWith("audio/") ||
    mime === "application/pdf" ||
    [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text",
      "application/rtf",
      "text/rtf",
      "text/plain",
    ].includes(mime)
  );
}

function imageOrPdf(mime = "") {
  return mime.startsWith("image/") || mime === "application/pdf";
}

function buildUpload({ maxFileSize, maxFiles, accept }) {
  return multer({
    // Disk-backed temporary uploads avoid holding documentary files in Node's RAM.
    storage: diskStorage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      fields: 80,
    },
    fileFilter(_req, file, callback) {
      if (!accept(file.mimetype)) {
        return callback(
          new AppError(
            `The file type ${file.mimetype || "unknown"} is not supported.`,
            415,
            "UNSUPPORTED_FILE_TYPE",
            { file: file.originalname, mimeType: file.mimetype }
          )
        );
      }
      return callback(null, true);
    },
  });
}

const evidenceUpload = buildUpload({
  maxFileSize: Number(process.env.EVIDENCE_MAX_FILE_BYTES) || 250 * 1024 * 1024,
  maxFiles: 20,
  accept: allowedEvidenceMime,
});

const protectedDocumentUpload = buildUpload({
  maxFileSize: Number(process.env.PROTECTED_FILE_MAX_BYTES) || 10 * 1024 * 1024,
  maxFiles: 6,
  accept: imageOrPdf,
});

const singleProtectedUpload = buildUpload({
  maxFileSize: Number(process.env.PROTECTED_FILE_MAX_BYTES) || 10 * 1024 * 1024,
  maxFiles: 1,
  accept: imageOrPdf,
});

const missingPhotoUpload = buildUpload({
  maxFileSize: Number(process.env.PROTECTED_FILE_MAX_BYTES) || 10 * 1024 * 1024,
  maxFiles: 1,
  accept: (mime) => mime.startsWith("image/"),
});

module.exports = {
  evidenceFiles: evidenceUpload.array("files", 20),
  supportDocuments: protectedDocumentUpload.array("documents", 6),
  supportMessageFile: singleProtectedUpload.single("file"),
  missingPersonPhoto: missingPhotoUpload.single("photo"),
};
