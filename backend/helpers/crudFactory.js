const AppError = require("./AppError");
const asyncHandler = require("./asyncHandler");
const { sendSuccess } = require("./apiResponse");
const { getPagination, paginationMeta, pick, escapeRegex } = require("./query");
const { writeAudit } = require("./activity");

function createCrudController({
  Model,
  resourceName,
  allowedCreateFields = [],
  allowedUpdateFields = [],
  searchFields = [],
  filterFields = [],
  populate = [],
  defaultSort = { createdAt: -1 },
  softDeleteField = null,
  createActorField = null,
  updateActorField = null,
  auditTargetType = null,
  beforeCreate = null,
  beforeUpdate = null,
}) {
  const create = asyncHandler(async (req, res) => {
    let payload = pick(req.body, allowedCreateFields);
    if (createActorField) payload[createActorField] = req.userId;
    if (beforeCreate) payload = await beforeCreate(payload, req);
    const item = await Model.create(payload);
    if (auditTargetType) await writeAudit(req, { action: "CREATE", targetType: auditTargetType, targetId: item._id, after: item.toObject() });
    return sendSuccess(res, { statusCode: 201, message: `${resourceName} created successfully.`, data: item });
  });

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (softDeleteField && req.query.includeDeleted !== "true") filter[softDeleteField] = null;
    for (const field of filterFields) {
      if (req.query[field] !== undefined && req.query[field] !== "") filter[field] = req.query[field];
    }
    if (req.query.q && searchFields.length) {
      const q = new RegExp(escapeRegex(req.query.q), "i");
      filter.$or = searchFields.map((field) => ({ [field]: q }));
    }

    let query = Model.find(filter).sort(defaultSort).skip(skip).limit(limit);
    for (const spec of populate) query = query.populate(spec);
    const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
    return sendSuccess(res, {
      message: `${resourceName} records retrieved successfully.`,
      data: items,
      meta: paginationMeta({ page, limit, total }),
    });
  });

  const getById = asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    for (const spec of populate) query = query.populate(spec);
    const item = await query;
    if (!item || (softDeleteField && item[softDeleteField] && req.query.includeDeleted !== "true")) {
      throw new AppError(`${resourceName} was not found.`, 404, "RESOURCE_NOT_FOUND");
    }
    return sendSuccess(res, { message: `${resourceName} retrieved successfully.`, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) throw new AppError(`${resourceName} was not found.`, 404, "RESOURCE_NOT_FOUND");
    const before = item.toObject();
    let updates = pick(req.body, allowedUpdateFields);
    if (updateActorField) updates[updateActorField] = req.userId;
    if (beforeUpdate) updates = await beforeUpdate(updates, req, item);
    Object.assign(item, updates);
    await item.save();
    if (auditTargetType) await writeAudit(req, { action: "UPDATE", targetType: auditTargetType, targetId: item._id, before, after: item.toObject() });
    return sendSuccess(res, { message: `${resourceName} updated successfully.`, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) throw new AppError(`${resourceName} was not found.`, 404, "RESOURCE_NOT_FOUND");
    if (softDeleteField) {
      item[softDeleteField] = new Date();
      await item.save({ validateBeforeSave: false });
    } else {
      await item.deleteOne();
    }
    if (auditTargetType) await writeAudit(req, { action: "DELETE", targetType: auditTargetType, targetId: item._id, before: item.toObject() });
    return sendSuccess(res, { message: `${resourceName} deleted successfully.`, data: null });
  });

  return { create, list, getById, update, remove };
}

module.exports = createCrudController;
