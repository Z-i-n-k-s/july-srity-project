const fs = require("fs");
const multer = require("multer");

function normalizeError(error) {
  if (error.name === "ValidationError") {
    return {
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message: "The submitted data did not pass validation.",
      details: Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })),
    };
  }

  if (error.name === "CastError") {
    return { statusCode: 400, code: "INVALID_VALUE", message: `Invalid value for ${error.path}.`, details: null };
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return {
      statusCode: 409,
      code: "DUPLICATE_VALUE",
      message: fields.length ? `A record with the same ${fields.join(", ")} already exists.` : "A duplicate record already exists.",
      details: error.keyValue || null,
    };
  }

  if (error instanceof multer.MulterError) {
    return {
      statusCode: error.code === "LIMIT_FILE_SIZE" ? 413 : 400,
      code: error.code,
      message: error.code === "LIMIT_FILE_SIZE" ? "The uploaded file exceeds the configured size limit." : error.message,
      details: null,
    };
  }

  return {
    statusCode: error.statusCode || 500,
    code: error.code || "INTERNAL_ERROR",
    message: error.isOperational ? error.message : "An unexpected server error occurred.",
    details: error.details || null,
  };
}

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `No API route matches ${req.method} ${req.originalUrl}.`,
    error: { code: "ROUTE_NOT_FOUND", details: null },
  });
}

function cleanupTemporaryUploads(req) {
  const files = [
    ...(Array.isArray(req.files) ? req.files : []),
    ...(req.file ? [req.file] : []),
  ];
  for (const file of files) {
    if (!file?.path) continue;
    try {
      fs.unlinkSync(file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        console.error(`Could not remove temporary upload ${file.path}:`, cleanupError.message);
      }
    }
  }
}

function errorHandler(error, req, res, _next) {
  cleanupTemporaryUploads(req);
  const normalized = normalizeError(error);
  if (normalized.statusCode >= 500) console.error(error);

  return res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    error: {
      code: normalized.code,
      details: normalized.details,
    },
  });
}

module.exports = { notFound, errorHandler };
