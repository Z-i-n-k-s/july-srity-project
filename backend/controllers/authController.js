const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AuthSession = require("../models/authSessionModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { hashToken, createRandomToken } = require("../helpers/security");
const { sendPasswordResetEmail } = require("../helpers/email");
const { pick } = require("../helpers/query");

function accessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.TOKEN_SECRET_KEY;
  if (!secret) throw new AppError("JWT_ACCESS_SECRET is missing from the environment configuration.", 500, "JWT_NOT_CONFIGURED");
  return secret;
}

function cookieOptions(maxAge) {
  const production = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    maxAge,
    path: "/",
  };
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    accessSecret(),
    { subject: String(user._id), expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );
}

async function issueSession(req, res, user) {
  const refreshToken = createRandomToken(48);
  const refreshDays = Math.max(Number(process.env.REFRESH_TOKEN_DAYS) || 7, 1);
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

  await AuthSession.create({
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    deviceName: req.body.deviceName || null,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || null,
    expiresAt: new Date(Date.now() + refreshMaxAge),
  });

  const accessToken = signAccessToken(user);
  res.cookie("token", accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", refreshToken, cookieOptions(refreshMaxAge));
  return accessToken;
}

const signUp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim()) throw new AppError("Name is required.", 422, "NAME_REQUIRED");
  if (!email?.trim()) throw new AppError("Email is required.", 422, "EMAIL_REQUIRED");
  if (!password || password.length < 8) throw new AppError("Password must contain at least 8 characters.", 422, "WEAK_PASSWORD");

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail, deletedAt: null });
  if (existing) throw new AppError("An account is already registered with this email address.", 409, "EMAIL_ALREADY_REGISTERED");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    ...pick(req.body, ["name", "username", "phone", "profilePic", "preferredLanguage"]),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "USER",
    accountStatus: "ACTIVE",
  });

  const accessToken = await issueSession(req, res, user);
  return sendSuccess(res, {
    statusCode: 201,
    message: "Your account was created successfully.",
    data: { user, accessToken },
  });
});

const signIn = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    throw new AppError(
      "Email and password are required.",
      422,
      "CREDENTIALS_REQUIRED"
    );
  }

  const user = await User.findOne({
    email,
    deletedAt: null,
  }).select("+passwordHash");

  if (!user) {
    throw new AppError(
      "The email or password is incorrect.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  /*
   * Prevent bcrypt.compare() from receiving undefined.
   * This normally means the account was created using the old `password` field.
   */
  if (!user.passwordHash) {
    throw new AppError(
      "This account does not contain a valid password hash. Please reset the password or register the account again.",
      409,
      "PASSWORD_HASH_MISSING"
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new AppError(
      "The email or password is incorrect.",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  if (user.accountStatus !== "ACTIVE") {
    throw new AppError(
      `This account is ${user.accountStatus.toLowerCase()}.`,
      403,
      "ACCOUNT_NOT_ACTIVE"
    );
  }

  user.lastLoginAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const accessToken = await issueSession(req, res, user);

  const publicUser = user.toObject();
  delete publicUser.passwordHash;
  delete publicUser.passwordResetTokenHash;
  delete publicUser.passwordResetTokenExpiresAt;

  return sendSuccess(res, {
    message: "You signed in successfully.",
    data: {
      user: publicUser,
      accessToken,
    },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!rawToken) throw new AppError("A refresh token is required.", 401, "REFRESH_TOKEN_REQUIRED");

  const replacement = createRandomToken(48);
  const refreshDays = Math.max(Number(process.env.REFRESH_TOKEN_DAYS) || 7, 1);
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;
  const session = await AuthSession.findOneAndUpdate(
    {
      refreshTokenHash: hashToken(rawToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        refreshTokenHash: hashToken(replacement),
        expiresAt: new Date(Date.now() + refreshMaxAge),
      },
    },
    { new: true, runValidators: true }
  );
  if (!session) {
    throw new AppError("The refresh session is invalid, expired, or was already rotated. Please sign in again.", 401, "INVALID_REFRESH_SESSION");
  }

  const user = await User.findOne({ _id: session.userId, deletedAt: null });
  if (!user || user.accountStatus !== "ACTIVE") {
    await AuthSession.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
    throw new AppError("The account is unavailable.", 401, "ACCOUNT_UNAVAILABLE");
  }

  const accessToken = signAccessToken(user);
  res.cookie("token", accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie("refreshToken", replacement, cookieOptions(refreshMaxAge));

  return sendSuccess(res, { message: "Session refreshed successfully.", data: { accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (rawToken) {
    await AuthSession.updateOne(
      { refreshTokenHash: hashToken(rawToken), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }
  res.clearCookie("token", cookieOptions(0));
  res.clearCookie("refreshToken", cookieOptions(0));
  return sendSuccess(res, { message: "You were logged out successfully.", data: null });
});

const logoutAll = asyncHandler(async (req, res) => {
  await AuthSession.updateMany({ userId: req.userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
  res.clearCookie("token", cookieOptions(0));
  res.clearCookie("refreshToken", cookieOptions(0));
  return sendSuccess(res, { message: "All active sessions were revoked.", data: null });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) throw new AppError("Email is required.", 422, "EMAIL_REQUIRED");

  const user = await User.findOne({ email, deletedAt: null });
  const genericMessage = "If an active account exists for that email, a password-reset message has been sent.";
  if (!user) return sendSuccess(res, { message: genericMessage, data: null });

  const resetToken = createRandomToken(32);
  user.passwordResetTokenHash = hashToken(resetToken);
  user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail({ user, resetToken });
  } catch (error) {
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    await user.save({ validateBeforeSave: false });
    throw error;
  }

  const data = process.env.NODE_ENV !== "production" && process.env.ALLOW_RESET_TOKEN_IN_RESPONSE === "true"
    ? { previewResetToken: resetToken }
    : null;
  return sendSuccess(res, { message: genericMessage, data });
});

const verifyResetToken = asyncHandler(async (req, res) => {
  const token = req.params.token;
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetTokenExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");

  if (!user) throw new AppError("The password-reset token is invalid or expired.", 400, "INVALID_RESET_TOKEN");
  return sendSuccess(res, { message: "The password-reset token is valid.", data: { valid: true } });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new AppError("Reset token and new password are required.", 422, "RESET_DATA_REQUIRED");
  if (password.length < 8) throw new AppError("Password must contain at least 8 characters.", 422, "WEAK_PASSWORD");

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetTokenExpiresAt: { $gt: new Date() },
    deletedAt: null,
  }).select("+passwordResetTokenHash +passwordResetTokenExpiresAt");

  if (!user) throw new AppError("The password-reset token is invalid or expired.", 400, "INVALID_RESET_TOKEN");

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;
  await user.save();
  await AuthSession.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });

  return sendSuccess(res, { message: "Your password was reset successfully. Please sign in again.", data: null });
});

module.exports = {
  signUp, signIn, refresh, logout, logoutAll,
  forgotPassword, verifyResetToken, resetPassword,
};
