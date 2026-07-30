const express = require("express");
const publicController = require("../controllers/frontendPublicController");
const submissions = require("../controllers/frontendSubmissionController");
const support = require("../controllers/frontendSupportController");
const missing = require("../controllers/frontendMissingController");
const admin = require("../controllers/frontendAdminController");
const memoryMap = require("../controllers/mapController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const uploads = require("../middleware/frontendUploads");

const router = express.Router();

// Public product routes used directly by the current React application.
router.get("/map/locations", memoryMap.summary);
router.get("/map/locations/:division/memories", memoryMap.listMemories);
router.get("/archive", publicController.listArchive);
router.get("/stories", publicController.listStories);
router.get("/timeline", publicController.listTimeline);

router.get("/archive/:id", (req, res, next) => {
  if (["events", "items", "admin"].includes(req.params.id)) return next();
  return publicController.getArchive(req, res, next);
});
router.get("/stories/:id", publicController.getStory);

// Evidence/testimony submission routes.
router.post("/submissions", authenticate, uploads.evidenceFiles, submissions.createSubmission);
router.get("/submissions/my", authenticate, submissions.listMine);
router.post("/submissions/drafts", authenticate, submissions.saveDraft);
router.get("/submissions/:id", authenticate, (req, res, next) => {
  if (["mine", "admin"].includes(req.params.id)) return next();
  return submissions.getMine(req, res, next);
});

// Injured-person support routes exposed by the frontend.
router.post("/support/requests", authenticate, uploads.supportDocuments, support.createRequest);
router.get("/support/rooms", authenticate, support.listRooms);
router.get("/support/rooms/:roomId", authenticate, support.getRoom);
router.post(
  "/support/rooms/:roomId/messages",
  authenticate,
  uploads.supportMessageFile,
  support.sendRoomMessage
);

// Missing-person routes. Exact routes must be registered before the public :id route.
router.post(
  "/missing-persons/reports",
  authenticate,
  uploads.missingPersonPhoto,
  missing.createReport
);
router.get("/missing-persons/reports/my", authenticate, missing.listMine);
router.get("/missing-persons/admin", authenticate, authorize("ADMIN"), missing.listAdmin);
router.patch("/missing-persons/:id/status", authenticate, authorize("ADMIN"), missing.changeStatus);
router.patch("/missing-persons/:id/assign", authenticate, authorize("ADMIN"), missing.assignAdmins);
router.patch(
  "/missing-persons/:reportId/sightings/:sightingId/status",
  authenticate,
  authorize("ADMIN"),
  missing.changeSightingStatus
);
router.post("/missing-persons/:id/sightings", authenticate, missing.createSighting);
router.get("/missing-persons", missing.listPublic);
router.get("/missing-persons/:id", optionalAuthenticate, (req, res, next) => {
  if (["public", "mine", "admin", "reports"].includes(req.params.id)) return next();
  return missing.getReport(req, res, next);
});

// Administrator product routes.
router.get("/admin/dashboard", authenticate, authorize("ADMIN"), admin.dashboard);
router.get("/admin/submissions", authenticate, authorize("ADMIN"), admin.listSubmissions);
router.post(
  "/admin/submissions/:id/review",
  authenticate,
  authorize("ADMIN"),
  admin.reviewSubmission
);
router.get("/admin/support-cases", authenticate, authorize("ADMIN"), support.listAdmin);
router.get("/admin/support-cases/:id", authenticate, authorize("ADMIN"), support.getAdminCase);
router.post(
  "/admin/support-cases/:id/messages",
  authenticate,
  authorize("ADMIN"),
  uploads.supportMessageFile,
  support.sendAdminMessage
);
router.post(
  "/admin/support-cases/:caseId/documents/:documentId/verify",
  authenticate,
  authorize("ADMIN"),
  support.verifyDocument
);
router.get("/admin/archive", authenticate, authorize("ADMIN"), admin.listArchive);
router.post(
  "/admin/archive/:id/publish",
  authenticate,
  authorize("ADMIN"),
  admin.publishArchive
);

module.exports = router;
