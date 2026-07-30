function sendSuccess(res, { statusCode = 200, message = "Request completed successfully.", data = null, meta = undefined } = {}) {
  const body = {
    success: true,
    message,
    data,
  };

  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess };
