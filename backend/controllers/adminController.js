const AdminNote = require("../models/adminNoteModel");
const AuditLog = require("../models/auditLogModel");
const SiteSetting = require("../models/siteSettingModel");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");
const { getPagination, paginationMeta, pick } = require("../helpers/query");
const { requireTarget } = require("../helpers/targetRegistry");
const { writeAudit } = require("../helpers/activity");

const createNote = asyncHandler(async (req, res) => {
  await requireTarget(req.body.targetType, req.body.targetId);
  const note = await AdminNote.create({
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    adminId: req.userId,
    note: req.body.note,
  });
  return sendSuccess(res, { statusCode: 201, message: "Private admin note created successfully.", data: note });
});

const listNotes = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.targetType) filter.targetType = req.query.targetType;
  if (req.query.targetId) filter.targetId = req.query.targetId;
  if (req.query.adminId) filter.adminId = req.query.adminId;
  const notes = await AdminNote.find(filter).select("+note").populate("adminId", "name email").sort({ createdAt: -1 });
  return sendSuccess(res, { message: "Admin notes retrieved successfully.", data: notes });
});

const updateNote = asyncHandler(async (req, res) => {
  const note = await AdminNote.findById(req.params.noteId).select("+note");
  if (!note) throw new AppError("Admin note was not found.", 404, "ADMIN_NOTE_NOT_FOUND");
  if (String(note.adminId) !== String(req.userId)) throw new AppError("Only the note author can edit this note.", 403, "FORBIDDEN");
  note.note = req.body.note;
  await note.save();
  return sendSuccess(res, { message: "Admin note updated successfully.", data: note });
});

const deleteNote = asyncHandler(async (req, res) => {
  const note = await AdminNote.findById(req.params.noteId).select("+note");
  if (!note) throw new AppError("Admin note was not found.", 404, "ADMIN_NOTE_NOT_FOUND");
  if (String(note.adminId) !== String(req.userId)) throw new AppError("Only the note author can delete this note.", 403, "FORBIDDEN");
  await note.deleteOne();
  return sendSuccess(res, { message: "Admin note deleted successfully.", data: null });
});

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  for (const field of ["actorId", "action", "targetType", "targetId"]) if (req.query[field]) filter[field] = req.query[field];
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .select(req.query.includeChanges === "true" ? "+changes +ipAddress +userAgent" : "")
      .populate("actorId", "name email role")
      .sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLog.countDocuments(filter),
  ]);
  return sendSuccess(res, { message: "Audit logs retrieved successfully.", data: items, meta: paginationMeta({ page, limit, total }) });
});

const listSettings = asyncHandler(async (_req, res) => {
  const settings = await SiteSetting.find().populate("updatedBy", "name email").sort({ key: 1 });
  return sendSuccess(res, { message: "Site settings retrieved successfully.", data: settings });
});

const getSetting = asyncHandler(async (req, res) => {
  const setting = await SiteSetting.findOne({ key: req.params.key });
  if (!setting) throw new AppError("Site setting was not found.", 404, "SETTING_NOT_FOUND");
  return sendSuccess(res, { message: "Site setting retrieved successfully.", data: setting });
});

const upsertSetting = asyncHandler(async (req, res) => {
  const setting = await SiteSetting.findOneAndUpdate(
    { key: req.params.key },
    {
      $set: {
        value: req.body.value,
        description: req.body.description || null,
        updatedBy: req.userId,
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await writeAudit(req, { action: "UPDATE", targetType: "SITE_SETTING", targetId: setting._id, after: setting.toObject() });
  return sendSuccess(res, { message: "Site setting saved successfully.", data: setting });
});

const deleteSetting = asyncHandler(async (req, res) => {
  const setting = await SiteSetting.findOneAndDelete({ key: req.params.key });
  if (!setting) throw new AppError("Site setting was not found.", 404, "SETTING_NOT_FOUND");
  await writeAudit(req, { action: "DELETE", targetType: "SITE_SETTING", targetId: setting._id, before: setting.toObject() });
  return sendSuccess(res, { message: "Site setting deleted successfully.", data: null });
});

module.exports = {
  createNote, listNotes, updateNote, deleteNote,
  listAuditLogs,
  listSettings, getSetting, upsertSetting, deleteSetting,
};
