# Frontend ↔ Backend Compatibility Audit

## Result

The existing React frontend was treated as the product specification. No React component, JSX, CSS, Tailwind class, route, field name, request payload, response-handling expression, or UI behavior was changed.

The backend now provides every API operation currently called by the frontend and maps the current forms and response shapes at the backend boundary.

## Source review performed

The audit inspected:

- `frontend/src/common/index.js` for endpoint URLs and HTTP methods
- `frontend/src/lib/api.js` for credentials, body type, fallback behavior, and response unwrapping
- all direct `fetch()` calls in authentication, profile, and user administration screens
- all pages using `publicApi`, `userApi`, and `adminApi`
- multipart form construction for documentary evidence, support requests, support messages, and missing-person reports
- UI field access for archive cards/details, stories, timeline, dashboards, submissions, support rooms/cases, missing persons, and user administration
- backend route order, middleware, controllers, models, serializers, error handling, cookies, CORS, Cloudinary integration, and status mappings

## Compatibility repairs

### 1. Frontend route layer

Added a dedicated compatibility router mounted before the larger backend route groups. This prevents generic or experimental backend routes from taking precedence over the routes used by the product.

Implemented or adapted 43 required method/path pairs, including:

- public archive, stories, timeline, and verified missing-person data
- documentary submissions and draft metadata
- injured-person support requests and private support rooms
- missing-person reporting and private sightings
- administrator dashboard, review queues, messages, document verification, missing-person review, and publication
- all legacy authentication/profile/user-management URLs used by older frontend screens

### 2. Request compatibility

Controllers accept the exact existing field names. Backend normalization converts display labels into internal enums without changing frontend payloads.

Examples:

- support labels such as `Medical Treatment` become the internal support enum
- submission source/identity labels become internal verification and anonymity values
- `contentTypes` and `privacyControls` JSON strings are parsed from multipart data
- missing-person status `REJECTED` is safely mapped to the model's `FALSE_REPORT`
- profile `language` and `publicName` labels are stored exactly as displayed while also maintaining internal preferred-language values

### 3. Response compatibility

Dedicated serializers return the flattened or nested data structures accessed by each page. This includes exact UI labels and defaults rather than exposing raw internal model values.

Examples:

- archive type values match filter labels: `Story`, `Testimony`, `Photograph`, `Video`, `Audio`, and `Document`
- new support cases display `Under review`
- submission cards display `Pending admin review`
- medical documents display `Pending verification`, `Verified`, or `Rejected`
- public missing-person endpoints expose only verified reports
- administrator missing-person detail keeps `report`, `privateDetails`, and `sightings` nesting
- empty collection endpoints return `data: []`

### 4. Authentication compatibility

- signup and reset-password now accept the frontend minimum of 6 characters
- sign-in explicitly selects `passwordHash`, preventing `bcrypt.compare(string, undefined)`
- a valid bcrypt hash stored by the legacy backend in `password` is accepted and migrated into `passwordHash`
- passwords and reset/session tokens are not returned in JSON
- current cookie authentication is preserved, with Bearer-token support for Swagger/API testing
- active account and live database role are checked for protected/admin routes
- logout supports the frontend's existing GET request

### 5. Database compatibility

Existing models were extended rather than replaced. Added compatibility fields include frontend submission labels, privacy controls, content types, location text, profile preferences, and public attribution. The missing-person photo reference is optional because the frontend form permits no photo.

The duplicate `auth_sessions.expiresAt` index definition was removed. The TTL index remains once at schema level.

### 6. Upload compatibility

The upload middleware uses the exact multipart field names and size/type constraints enforced by the frontend. Documentary files are written to a temporary disk location before Cloudinary upload, avoiding a possible 1 GB in-memory request. Temporary files are removed after success and on controller/middleware errors.

Supported evidence includes images, video, audio, PDF, DOC, DOCX, ODT, RTF, and TXT MIME types. Support documents remain limited to image/PDF as required by the UI.

### 7. Error and HTTP compatibility

- `201` for created submissions, reports, requests, and messages
- `200` for reads and updates
- `401` for missing/invalid authentication
- `403` for inactive accounts or insufficient role
- `404` for unavailable resources
- `409` for duplicates/conflicts
- `413` for file-size limits
- `415` for unsupported file types
- `422` for clear form/business validation errors
- `500/502/503` for internal, Cloudinary, email, encryption, or database service failures

Errors include a user-readable `message` plus a stable error code.

## Files added

```text
controllers/frontendAdminController.js
controllers/frontendMissingController.js
controllers/frontendPublicController.js
controllers/frontendSubmissionController.js
controllers/frontendSupportController.js
helpers/frontendCompatibility.js
helpers/frontendUpload.js
middleware/frontendUploads.js
routes/frontendCompatibilityRoutes.js
scripts/check-frontend-contract.js
FRONTEND_API_CONTRACT.md
FRONTEND_COMPATIBILITY_AUDIT.md
```

## Existing backend files adapted

```text
controllers/authController.js
controllers/legacyController.js
controllers/userController.js
helpers/frontendUpload.js
index.js
middleware/csrfOriginGuard.js
middleware/errorHandler.js
models/authSessionModel.js
models/documentaryItemModel.js
models/documentarySubmissionModel.js
models/julyEventModel.js
models/missingPersonReportModel.js
models/userModel.js
package.json
routes/index.js
scripts/check-load.js
```

Backend-only route groups and models were left in place unless they interfered with the frontend contract.

## Static verification

The package includes:

```bash
npm run check
```

It performs:

1. syntax validation for every JavaScript file
2. stubbed module loading for models, controllers, middleware, configuration, and routers
3. a frontend contract check for all 43 required route method/path pairs and key serializer fields

Audit result in this workspace:

```text
Syntax check passed for 101 JavaScript files.
Module load check passed for 97 JavaScript modules.
Frontend contract check passed for 43 required API routes.
```

## Setup

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run check
npm run dev
```

Required local values:

```env
PORT=8080
FRONTEND_URL=http://localhost:3000
MONGODB_URI=your-mongodb-uri
JWT_ACCESS_SECRET=long-random-secret
FIELD_ENCRYPTION_KEY=long-random-encryption-secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Password reset additionally needs `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM`.

The existing frontend can use its default backend URL. To set it explicitly:

```env
REACT_APP_BACKEND_URL=http://localhost:8080
```

## Live-service testing limitation

Static checks passed, but a complete live integration run against the user's MongoDB, Cloudinary account, and SMTP account cannot be performed in this environment because those external credentials and services are not available here. Run the manual smoke-test sequence below after setting `.env`.

## Manual smoke-test sequence

1. Start MongoDB or configure MongoDB Atlas.
2. Start backend on port 8080.
3. Start the existing CRA frontend on port 3000.
4. Create a user, sign out, sign in, and update the profile.
5. Promote one test user to `ADMIN` in MongoDB or through an existing admin account.
6. Submit documentary evidence, open My Submissions, review it as admin, approve it, and publish it.
7. Confirm the public archive, story page, and timeline display the published data.
8. Create a support request, open its support room, reply as user/admin, and verify an uploaded document.
9. Submit a missing-person report, review it as admin, mark it verified, confirm it appears publicly, and submit a private sighting.
10. Test forgot-password only after SMTP values are configured.

## Known production considerations

- Cloudinary `secure_url` is HTTPS but not automatically private. Medical, identity, sighting, and original evidence delivery should use authenticated/private Cloudinary delivery or short-lived signed access.
- Multi-document workflows would gain stronger atomic guarantees from MongoDB transactions on a replica set.
- Real malware scanning and file signature inspection are separate deployment concerns; MIME validation and checksums alone do not prove a file is safe or truthful.
