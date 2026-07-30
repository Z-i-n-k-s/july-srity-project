const Notification = require("../models/notificationModel");
const AuditLog = require("../models/auditLogModel");
const { redactObject } = require("./security");

async function createNotification(payload) {
  try {
    return await Notification.create(payload);
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
}

async function writeAudit(req, { action, targetType, targetId, before = null, after = null }) {
  if (!req.userId || !targetId) return null;
  try {
    return await AuditLog.create({
      actorId: req.userId,
      action,
      targetType,
      targetId,
      changes: before || after ? { before: redactObject(before), after: redactObject(after) } : undefined,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || null,
    });
  } catch (error) {
    console.error("Audit log creation failed:", error.message);
    return null;
  }
}

module.exports = { createNotification, writeAudit };
