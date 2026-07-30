const DocumentarySubmission = require("../models/documentarySubmissionModel");
const SupportCase = require("../models/supportCaseModel");
const MissingPersonReport = require("../models/missingPersonReportModel");
const MissingPersonSighting = require("../models/missingPersonSightingModel");
const MediaAsset = require("../models/mediaAssetModel");
const JulyEvent = require("../models/julyEventModel");
const DocumentaryItem = require("../models/documentaryItemModel");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const AppError = require("./AppError");

const TARGET_MODELS = {
  DOCUMENTARY_SUBMISSION: DocumentarySubmission,
  SUPPORT_CASE: SupportCase,
  MISSING_PERSON_REPORT: MissingPersonReport,
  MISSING_PERSON_SIGHTING: MissingPersonSighting,
  MEDIA_ASSET: MediaAsset,
  JULY_EVENT: JulyEvent,
  DOCUMENTARY_ITEM: DocumentaryItem,
  MESSAGE: Message,
  USER: User,
};

async function requireTarget(targetType, targetId) {
  const Model = TARGET_MODELS[targetType];
  if (!Model) throw new AppError(`Unsupported target type: ${targetType}.`, 422, "UNSUPPORTED_TARGET_TYPE");
  const target = await Model.findById(targetId);
  if (!target) throw new AppError(`${targetType} target was not found.`, 404, "TARGET_NOT_FOUND");
  return target;
}

module.exports = { TARGET_MODELS, requireTarget };
