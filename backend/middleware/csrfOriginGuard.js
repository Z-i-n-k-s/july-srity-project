const AppError = require("../helpers/AppError");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

module.exports = function csrfOriginGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.cookies?.token && !req.cookies?.accessToken && !req.cookies?.refreshToken) return next();
  if (req.get("authorization")?.startsWith("Bearer ")) return next();

  const allowedOrigins = String(process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const origin = req.get("origin");
  const referer = req.get("referer");

  const trusted = origin
    ? allowedOrigins.includes(origin)
    : referer
      ? allowedOrigins.some((allowed) => referer.startsWith(allowed))
      : process.env.NODE_ENV !== "production";

  // 👇 Add this
  console.log({
    frontendUrl: process.env.FRONTEND_URL,
    allowedOrigins,
    origin,
    referer,
    cookies: req.cookies,
    trusted,
  });

  if (!trusted) {
    return next(
      new AppError(
        "The request origin could not be verified.",
        403,
        "UNTRUSTED_REQUEST_ORIGIN"
      )
    );
  }

  next();
};