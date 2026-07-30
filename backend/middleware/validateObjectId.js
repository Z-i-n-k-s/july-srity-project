const mongoose = require("mongoose");
const AppError = require("../helpers/AppError");

function validateObjectId(...paramNames) {
  return function objectIdValidator(req, _res, next) {
    for (const name of paramNames) {
      const value = req.params[name];
      if (value && !mongoose.isValidObjectId(value)) {
        return next(new AppError(`The ${name} parameter is not a valid MongoDB ObjectId.`, 400, "INVALID_OBJECT_ID"));
      }
    }
    next();
  };
}

module.exports = validateObjectId;
