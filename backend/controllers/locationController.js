const Location = require("../models/locationModel");
const JulyEvent = require("../models/julyEventModel");
const DocumentarySubmission = require("../models/documentarySubmissionModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const SupportCase = require("../models/supportCaseModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const MissingPersonSighting = require("../models/missingPersonSightingModel");
const createCrudController = require("../helpers/crudFactory");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/apiResponse");

const crud = createCrudController({
  Model: Location,
  resourceName: "Location",
  allowedCreateFields: ["name", "nameBn", "type", "parentLocationId", "geoLocation"],
  allowedUpdateFields: ["name", "nameBn", "type", "parentLocationId", "geoLocation"],
  searchFields: ["name", "nameBn"],
  filterFields: ["type", "parentLocationId"],
  populate: [{ path: "parentLocationId", select: "name nameBn type" }],
  auditTargetType: "LOCATION",
});

const nearby = asyncHandler(async (req, res) => {
  const longitude = Number(req.query.longitude);
  const latitude = Number(req.query.latitude);
  const maxDistance = Math.min(Math.max(Number(req.query.maxDistance) || 20000, 100), 200000);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new AppError("longitude and latitude query parameters are required.", 422, "COORDINATES_REQUIRED");
  }
  const locations = await Location.find({
    geoLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: maxDistance,
      },
    },
  }).limit(50);
  return sendSuccess(res, { message: "Nearby locations retrieved successfully.", data: locations });
});

const remove = asyncHandler(async (req, res, next) => {
  const references = await Promise.all([
    Location.exists({ parentLocationId: req.params.id }),
    JulyEvent.exists({ locationId: req.params.id }),
    DocumentarySubmission.exists({ locationId: req.params.id, deletedAt: null }),
    DocumentaryItem.exists({ locationId: req.params.id, deletedAt: null }),
    SupportCase.exists({ districtId: req.params.id, deletedAt: null }),
    MissingPersonReport.exists({ "lastSeen.locationId": req.params.id, deletedAt: null }),
    MissingPersonSighting.exists({ locationId: req.params.id }),
  ]);
  if (references.some(Boolean)) {
    throw new AppError("This location is used by another location or application record and cannot be deleted.", 409, "LOCATION_IN_USE");
  }
  return crud.remove(req, res, next);
});

module.exports = { ...crud, nearby, remove };
