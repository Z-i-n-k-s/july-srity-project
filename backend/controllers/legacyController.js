const User = require("../models/userModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");

const searchUserByEmail = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) throw new AppError("Email is required.", 422, "EMAIL_REQUIRED");
  const user = await User.findOne({ email, deletedAt: null });
  if (!user) throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  return sendSuccess(res, { message: "User found.", data: user });
});

const listAllUsersForFrontend = asyncHandler(async (_req, res) => {
  const users = await User.find({ deletedAt: null }).sort({ createdAt: -1 });
  return sendSuccess(res, {
    message: "Users retrieved successfully.",
    data: users,
  });
});

module.exports = { searchUserByEmail, listAllUsersForFrontend };
