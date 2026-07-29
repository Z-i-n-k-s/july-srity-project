const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");

function extractAccessToken(req) {
  const header = req.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return req.cookies?.token || req.cookies?.accessToken || null;
}

const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (!token) {
    throw new AppError("Authentication is required to access this resource.", 401, "AUTHENTICATION_REQUIRED");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.TOKEN_SECRET_KEY);
  } catch (error) {
    throw new AppError(
      error.name === "TokenExpiredError" ? "Your access token has expired." : "The access token is invalid.",
      401,
      error.name === "TokenExpiredError" ? "ACCESS_TOKEN_EXPIRED" : "INVALID_ACCESS_TOKEN"
    );
  }

  const user = await User.findOne({ _id: decoded.sub || decoded._id, deletedAt: null });
  if (!user) throw new AppError("The account linked to this token no longer exists.", 401, "ACCOUNT_NOT_FOUND");
  if (user.accountStatus !== "ACTIVE") {
    throw new AppError(`This account is ${user.accountStatus.toLowerCase()}.`, 403, "ACCOUNT_NOT_ACTIVE");
  }

  req.user = user;
  req.userId = user._id;
  next();
});

const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  const token = extractAccessToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || process.env.TOKEN_SECRET_KEY);
    const user = await User.findOne({ _id: decoded.sub || decoded._id, deletedAt: null });
    if (user?.accountStatus === "ACTIVE") {
      req.user = user;
      req.userId = user._id;
    }
  } catch (_error) {
    // Public routes stay usable when an optional token is missing, expired, or invalid.
  }
  next();
});

module.exports = { authenticate, optionalAuthenticate, extractAccessToken };
