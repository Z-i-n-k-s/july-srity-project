const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const routeFiles = [
  path.join(root, "routes", "frontendCompatibilityRoutes.js"),
  path.join(root, "routes", "index.js"),
];

const expectedRoutes = [
  ["POST", "/signup"],
  ["POST", "/signin"],
  ["GET", "/user-details"],
  ["POST", "/forgot-password"],
  ["GET", "/verify-reset-token/:token"],
  ["POST", "/reset-password"],
  ["GET", "/userLogout"],
  ["GET", "/all-user"],
  ["POST", "/user-search"],
  ["POST", "/update-user"],
  ["POST", "/update-profile"],
  ["POST", "/delete-user"],
  ["GET", "/archive"],
  ["GET", "/archive/:id"],
  ["GET", "/stories"],
  ["GET", "/stories/:id"],
  ["GET", "/timeline"],
  ["GET", "/missing-persons"],
  ["GET", "/missing-persons/:id"],
  ["POST", "/submissions"],
  ["GET", "/submissions/my"],
  ["GET", "/submissions/:id"],
  ["POST", "/submissions/drafts"],
  ["POST", "/support/requests"],
  ["GET", "/support/rooms"],
  ["GET", "/support/rooms/:roomId"],
  ["POST", "/support/rooms/:roomId/messages"],
  ["POST", "/missing-persons/reports"],
  ["GET", "/missing-persons/reports/my"],
  ["POST", "/missing-persons/:id/sightings"],
  ["GET", "/admin/dashboard"],
  ["GET", "/admin/submissions"],
  ["POST", "/admin/submissions/:id/review"],
  ["GET", "/admin/support-cases"],
  ["GET", "/admin/support-cases/:id"],
  ["POST", "/admin/support-cases/:id/messages"],
  ["POST", "/admin/support-cases/:caseId/documents/:documentId/verify"],
  ["GET", "/missing-persons/admin"],
  ["PATCH", "/missing-persons/:id/status"],
  ["PATCH", "/missing-persons/:id/assign"],
  ["PATCH", "/missing-persons/:reportId/sightings/:sightingId/status"],
  ["GET", "/admin/archive"],
  ["POST", "/admin/archive/:id/publish"],
];

const serializerRequirements = {
  "controllers/frontendPublicController.js": [
    "titleEn",
    "verificationNote",
    "contentWarning",
    "mediaCount",
    "recordCount",
  ],
  "controllers/frontendSubmissionController.js": [
    "contentTypes",
    "attachmentCount",
    "identityPreference",
    "publicationPermission",
    "privacyControls",
    "attachments",
  ],
  "controllers/frontendSupportController.js": [
    "assignedAdmin",
    "documents",
    "messages",
    "progress",
    "Pending verification",
  ],
  "controllers/frontendMissingController.js": [
    "privateDetails",
    "sightings",
    "reporter",
    "relationship",
  ],
  "controllers/frontendAdminController.js": [
    "recentActivity",
    "verification",
  ],
};

function collectRoutes() {
  const found = new Set();
  const routePattern = /router\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]/gms;

  for (const file of routeFiles) {
    const source = fs.readFileSync(file, "utf8");
    let match;
    while ((match = routePattern.exec(source))) {
      found.add(`${match[1].toUpperCase()} ${match[2]}`);
    }
  }
  return found;
}

function checkRoutes() {
  const found = collectRoutes();
  const missing = expectedRoutes
    .map(([method, route]) => `${method} ${route}`)
    .filter((route) => !found.has(route));

  if (missing.length) {
    throw new Error(`Missing frontend routes:\n- ${missing.join("\n- ")}`);
  }
}

function checkSerializerFields() {
  const missing = [];
  for (const [relativeFile, fields] of Object.entries(serializerRequirements)) {
    const source = fs.readFileSync(path.join(root, relativeFile), "utf8");
    for (const field of fields) {
      if (!source.includes(field)) missing.push(`${relativeFile}: ${field}`);
    }
  }
  if (missing.length) {
    throw new Error(`Missing frontend response/payload compatibility markers:\n- ${missing.join("\n- ")}`);
  }
}

function checkFrontendUnchanged() {
  const frontendPath = path.resolve(root, "../../frontend_src/frontend");
  if (!fs.existsSync(frontendPath)) return;
  const modifiedFrontendCopy = path.resolve(root, "../frontend");
  if (fs.existsSync(modifiedFrontendCopy)) {
    throw new Error("A frontend copy exists in the integration output. This audit must modify backend files only.");
  }
}

try {
  checkRoutes();
  checkSerializerFields();
  checkFrontendUnchanged();
  console.log(`Frontend contract check passed for ${expectedRoutes.length} required API routes.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
