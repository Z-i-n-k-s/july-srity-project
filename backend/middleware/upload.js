const multer = require("multer");
const AppError = require("../helpers/AppError");

const allowedMimeTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
  "application/pdf", "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const maxBytes = (Number(process.env.MAX_UPLOAD_MB) || 25) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError(`File type ${file.mimetype} is not supported.`, 415, "UNSUPPORTED_FILE_TYPE"));
    }
    callback(null, true);
  },
});

module.exports = upload;
