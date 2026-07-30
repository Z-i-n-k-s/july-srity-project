const User = require("../models/userModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick, escapeRegex } = require("../helpers/query");
const { writeAudit } = require("../helpers/activity");

const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { message: "User profile retrieved successfully.", data: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const before = req.user.toObject();
  const updates = pick(req.body, ["name", "username", "phone", "profilePic", "avatarMediaId", "preferredLanguage"]);
  const user = await User.findByIdAndUpdate(req.userId, updates, { new: true, runValidators: true });
  await writeAudit(req, { action: "UPDATE", targetType: "USER", targetId: user._id, before, after: user.toObject() });
  return sendSuccess(res, { message: "Your profile was updated successfully.", data: user });
});

const deleteMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    { deletedAt: new Date(), accountStatus: "BLOCKED" },
    { new: true }
  );
  await writeAudit(req, { action: "DELETE", targetType: "USER", targetId: user._id, after: { deletedAt: user.deletedAt } });
  return sendSuccess(res, { message: "Your account was deactivated successfully.", data: null });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { deletedAt: req.query.includeDeleted === "true" ? { $exists: true } : null };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.accountStatus) filter.accountStatus = req.query.accountStatus;
  if (req.query.q) {
    const q = new RegExp(escapeRegex(req.query.q), "i");
    filter.$or = [{ name: q }, { email: q }, { username: q }, { phone: q }];
  }
  if (req.query.includeDeleted === "true") delete filter.deletedAt;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendSuccess(res, {
    message: "Users retrieved successfully.",
    data: users,
    meta: paginationMeta({ page, limit, total }),
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  return sendSuccess(res, { message: "User retrieved successfully.", data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  const before = user.toObject();
  const updates = pick(req.body, ["name", "username", "email", "phone", "profilePic", "avatarMediaId", "preferredLanguage", "role", "accountStatus"]);
  Object.assign(user, updates);
  await user.save();
  await writeAudit(req, { action: "UPDATE", targetType: "USER", targetId: user._id, before, after: user.toObject() });
  return sendSuccess(res, { message: "User account updated successfully.", data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.userId) === String(req.params.userId)) {
    throw new AppError("Administrators cannot delete their own account from this endpoint.", 422, "SELF_DELETE_NOT_ALLOWED");
  }
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { deletedAt: new Date(), accountStatus: "BLOCKED" },
    { new: true }
  );
  if (!user) throw new AppError("User was not found.", 404, "USER_NOT_FOUND");
  await writeAudit(req, { action: "DELETE", targetType: "USER", targetId: user._id, after: { deletedAt: user.deletedAt } });
  return sendSuccess(res, { message: "User account was deactivated.", data: null });
});

module.exports = { getMe, updateMe, deleteMe, listUsers, getUser, updateUser, deleteUser };
