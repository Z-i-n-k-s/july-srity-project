const Tag = require("../models/tagModel");
const JulyEvent = require("../models/julyEventModel");
const DocumentarySubmission = require("../models/documentarySubmissionModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const createCrudController = require("../helpers/crudFactory");
const asyncHandler = require("../helpers/asyncHandler");
const AppError = require("../helpers/AppError");
const { slugify } = require("../helpers/identifiers");

const crud = createCrudController({
  Model: Tag,
  resourceName: "Tag",
  allowedCreateFields: ["name", "nameBn", "slug", "description"],
  allowedUpdateFields: ["name", "nameBn", "slug", "description"],
  searchFields: ["name", "nameBn", "slug", "description"],
  filterFields: [],
  createActorField: "createdBy",
  auditTargetType: "TAG",
  beforeCreate: async (payload) => ({ ...payload, slug: payload.slug ? slugify(payload.slug) : slugify(payload.name) }),
  beforeUpdate: async (updates) => ({ ...updates, ...(updates.slug ? { slug: slugify(updates.slug) } : {}) }),
});

const remove = asyncHandler(async (req, res, next) => {
  const references = await Promise.all([
    JulyEvent.exists({ tagIds: req.params.id }),
    DocumentarySubmission.exists({ tagIds: req.params.id, deletedAt: null }),
    DocumentaryItem.exists({ tagIds: req.params.id, deletedAt: null }),
  ]);
  if (references.some(Boolean)) throw new AppError("This tag is used by archive records or submissions and cannot be deleted.", 409, "TAG_IN_USE");
  return crud.remove(req, res, next);
});

module.exports = { ...crud, remove };
