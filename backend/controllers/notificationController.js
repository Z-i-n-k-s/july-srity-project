const Notification = require("../models/notificationModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta } = require("../helpers/query");

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.userId };
  if (req.query.unread === "true") filter.readAt = null;
  if (req.query.type) filter.type = req.query.type;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.userId, readAt: null }),
  ]);
  return sendSuccess(res, {
    message: "Notifications retrieved successfully.",
    data: items,
    meta: { ...paginationMeta({ page, limit, total }), unreadCount },
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.userId },
    { $set: { readAt: new Date() } },
    { new: true }
  );
  if (!notification) throw new AppError("Notification was not found.", 404, "NOTIFICATION_NOT_FOUND");
  return sendSuccess(res, { message: "Notification marked as read.", data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany({ userId: req.userId, readAt: null }, { $set: { readAt: new Date() } });
  return sendSuccess(res, { message: "All notifications were marked as read.", data: { updatedCount: result.modifiedCount } });
});

const remove = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.notificationId, userId: req.userId });
  if (!notification) throw new AppError("Notification was not found.", 404, "NOTIFICATION_NOT_FOUND");
  return sendSuccess(res, { message: "Notification deleted successfully.", data: null });
});

module.exports = { list, markRead, markAllRead, remove };
