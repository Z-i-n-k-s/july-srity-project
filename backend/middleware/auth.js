const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AuthSession = require("../models/authSessionModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { hashToken } = require("../helpers/security");

function extractAccessToken(req) {
  const header = req.get("authorization");

  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }

  return req.cookies?.token || req.cookies?.accessToken || null;
}

function extractRefreshToken(req) {
  return req.cookies?.refreshToken || null;
}

function accessSecret() {
  const secret =
    process.env.JWT_ACCESS_SECRET || process.env.TOKEN_SECRET_KEY;

  if (!secret) {
    throw new AppError(
      "JWT access secret is missing.",
      500,
      "JWT_NOT_CONFIGURED"
    );
  }

  return secret;
}

function cookieOptions(maxAge) {
  const production = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax",
    maxAge,
    path: "/",
  };
}

function createAccessToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    accessSecret(),
    {
      subject: String(user._id),
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    }
  );
}


async function validateUser(decoded) {
  const user = await User.findOne({
    _id: decoded.sub || decoded._id,
    deletedAt: null,
  });

  if (!user) {
    throw new AppError(
      "The account linked to this token no longer exists.",
      401,
      "ACCOUNT_NOT_FOUND"
    );
  }

  if (user.accountStatus !== "ACTIVE") {
    throw new AppError(
      `This account is ${user.accountStatus.toLowerCase()}.`,
      403,
      "ACCOUNT_NOT_ACTIVE"
    );
  }

  return user;
}


async function refreshAccessToken(req, res) {
  const refreshToken = extractRefreshToken(req);

  if (!refreshToken) {
    throw new AppError(
      "Refresh token is required.",
      401,
      "REFRESH_TOKEN_REQUIRED"
    );
  }


  const session = await AuthSession.findOne({
    refreshTokenHash: hashToken(refreshToken),
    revokedAt: null,
    expiresAt: {
      $gt: new Date(),
    },
  });


  if (!session) {
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    throw new AppError(
      "Invalid refresh session. Please login again.",
      401,
      "INVALID_REFRESH_SESSION"
    );
  }


  const user = await User.findOne({
    _id: session.userId,
    deletedAt: null,
  });


  if (!user || user.accountStatus !== "ACTIVE") {
    await AuthSession.updateOne(
      {
        _id: session._id,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );


    throw new AppError(
      "The account is unavailable.",
      401,
      "ACCOUNT_UNAVAILABLE"
    );
  }


  const newAccessToken = createAccessToken(user);


  res.cookie(
    "token",
    newAccessToken,
    cookieOptions(15 * 60 * 1000)
  );


  return {
    user,
    token: newAccessToken,
  };
}



const authenticate = asyncHandler(async (req, res, next) => {

  let token = extractAccessToken(req);

  if (!token) {

    const refreshed = await refreshAccessToken(req, res);

    req.user = refreshed.user;
    req.userId = refreshed.user._id;

    return next();
  }


  let decoded;


  try {

    decoded = jwt.verify(
      token,
      accessSecret()
    );


  } catch (error) {


    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {

      const refreshed = await refreshAccessToken(req, res);

      req.user = refreshed.user;
      req.userId = refreshed.user._id;

      return next();

    }


    throw new AppError(
      "Invalid access token.",
      401,
      "INVALID_ACCESS_TOKEN"
    );
  }


  const user = await validateUser(decoded);


  req.user = user;
  req.userId = user._id;


  next();
});



const optionalAuthenticate = asyncHandler(async (req, res, next) => {

  const token = extractAccessToken(req);


  if (!token) {
    return next();
  }


  try {

    const decoded = jwt.verify(
      token,
      accessSecret()
    );


    const user = await validateUser(decoded);


    req.user = user;
    req.userId = user._id;


  } catch (error) {

    // Optional authentication:
    // Ignore invalid/expired tokens.

  }


  next();
});



module.exports = {
  authenticate,
  optionalAuthenticate,
  extractAccessToken,
};