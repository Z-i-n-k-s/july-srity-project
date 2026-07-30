const AppError = require("../helpers/AppError");

function authorize(...roles) {
  return function roleAuthorization(req, _res, next) {
    if (!req.user) return next(new AppError("Authentication is required.", 401, "AUTHENTICATION_REQUIRED"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403, "FORBIDDEN"));
    }
    next();
  };
}

module.exports = authorize;
