# July Smriti Archive Backend

Production-minded CommonJS/Express/Mongoose REST API for the July Smriti Archive MERN project.

## What this backend implements

The landing-page specification presents one connected story around testimony preservation, a verified July archive, transparent human review, injured-person support, offline drafts, transparency statistics, and the deterministic July Sathi helper. The uploaded backend adds a larger 29-collection domain model containing authentication, missing-person workflows, conversations, notifications, moderation, consent, auditing, and site administration.

This package connects both sources without pretending that visual-only landing-page features need backend controllers.

### Core application modules

- Authentication with access cookies/tokens, rotating refresh sessions, logout-all, forgot password, and secure hashed reset tokens
- User profile and admin account management
- Cloudinary uploads with MIME/size validation, SHA-256 checksum, visibility, moderation, sensitivity, and soft deletion
- Tags, locations, GeoJSON nearby search, and July timeline events
- Testimony/documentary drafts, offline idempotency, submission, assignment, verification, rejection, publication, corrections, and archival
- Public documentary records with content warnings, public verification labels, source labels, featured records, view counts, and version history
- Human verification reviews and checklist results
- Injured-person support requests with private details, consent, case assignment, controlled status transitions, assistance records, and history
- Missing-person reports, private reporter data, verified public notices, sightings, status history, and found-person privacy handling
- Support/review/general conversations, participants, messages, receipts, document requests, and restricted file visibility
- Notifications, consent history, abuse/moderation reports, admin notes, audit logs, and site settings
- Live transparency statistics and deterministic July Sathi action guidance
- Offline sync aliases using stable `clientDraftId` values to prevent duplicate testimony/support records after retries


## Existing frontend compatibility

The React frontend is the source of truth for this integration. The backend exposes every route currently called by `src/common/index.js`, `src/lib/api.js`, and the direct authentication/profile/admin `fetch()` calls. No frontend file is included or modified in this backend package. See `FRONTEND_API_CONTRACT.md` and `FRONTEND_COMPATIBILITY_AUDIT.md`.

## Folder structure

```text
backend/
├── config/
│   ├── cloudinary.js
│   └── db.js
├── controllers/
├── helpers/
├── middleware/
├── models/                 # 29 Mongoose models
│   └── shared/
├── routes/
├── scripts/
│   ├── check-syntax.js
│   └── check-load.js
├── .env.example
├── index.js
├── package.json
└── vercel.json
```

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The default local API address is:

```text
http://localhost:8080/api
```

Health check:

```text
GET http://localhost:8080/health
```

## Required environment configuration

At minimum, set:

```env
MONGODB_URI=
FRONTEND_URL=http://localhost:3000
JWT_ACCESS_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Set `FIELD_ENCRYPTION_KEY` before accepting national-ID or private sighting-phone values. Password-reset email additionally requires the `EMAIL_*` values.

Never commit `.env`.

## Standard JSON responses

Successful response:

```json
{
  "success": true,
  "message": "Documentary submission sent for admin review.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 48,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Error response:

```json
{
  "success": false,
  "message": "Status cannot change from DRAFT to VERIFIED.",
  "error": {
    "code": "INVALID_STATUS_TRANSITION",
    "details": {
      "currentStatus": "DRAFT",
      "nextStatus": "VERIFIED",
      "allowed": ["SUBMITTED", "ARCHIVED"]
    }
  }
}
```

## HTTP status usage

- `200` successful read/update/delete or idempotent retry
- `201` newly created resource
- `400` malformed ID/value/token
- `401` missing, expired, or invalid authentication
- `403` authenticated but not permitted
- `404` route/resource not found
- `409` duplicate resource or conflicting active workflow
- `413` upload too large
- `415` unsupported media type
- `422` semantically invalid form or status transition
- `429` rate limit reached
- `500` unexpected server failure
- `502` Cloudinary upstream upload failure
- `503` required email/encryption service is not configured

## Authentication

The API accepts either:

```text
Authorization: Bearer <access-token>
```

or the HTTP-only `token` cookie. Sign-in also issues a rotating `refreshToken` cookie backed by `auth_sessions`.

Main routes:

```text
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
POST /api/auth/forgot-password
GET  /api/auth/verify-reset-token/:token
POST /api/auth/reset-password
```

The old frontend routes such as `/api/signup`, `/api/signin`, `/api/user-details`, `/api/update-profile`, and `/api/userLogout` remain as compatibility aliases.

## Cloudinary upload

Send one multipart file using field name `file`:

```text
POST /api/media
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

Optional text fields:

```text
visibility=PRIVATE
sensitivityLevel=NONE
```

The server calculates a SHA-256 checksum and records Cloudinary metadata in `media_assets`.

For production medical/identity files, configure Cloudinary authenticated/private delivery. Application-level API authorization alone does not make an ordinary public Cloudinary delivery URL private.

## Offline sync

The PDF keeps the offline queue in frontend `localStorage`. The backend supplies retry-safe endpoints for when the connection returns:

```text
POST /api/offline/sync/testimony
POST /api/offline/sync/support-request
```

Each draft must keep the same stable `clientDraftId` across retries. The unique compound indexes prevent a lost response from creating duplicate records.

Large files should not be placed in `localStorage`; upload them after reconnecting and then attach returned media IDs.

## Verification principle

File integrity is not the same as truth verification. A SHA-256 checksum can reveal that file bytes changed; human review must still examine source, date, place, context, privacy risk, and supporting evidence.

## Safety and privacy

- Passwords and refresh/reset tokens are stored only as hashes.
- Public and private case/report data remain in separate collections.
- Sensitive field access is role/ownership controlled and audited; encrypted database values are removed from API responses.
- Media IDs are checked for ownership/access before they can be attached, and public archive/event/missing-person media must be `READY`, `APPROVED`, `PUBLIC`, and not deleted before publication.
- Missing-person sightings remain private until reviewed.
- Found-person status disables public contact details.
- Support forms warn that the platform is not an emergency medical service.
- Audit snapshots redact password/token/NID fields.
- Cookie-authenticated unsafe requests receive an origin check.

## Validation and status workflows

Controllers do not accept arbitrary jumps such as `DRAFT -> VERIFIED`. Controlled transition maps are defined in:

```text
helpers/statusTransitions.js
```

History/version/audit collections are treated as append-only records rather than exposing unsafe unrestricted update/delete APIs.

## Development checks

```bash
npm run check
```

This performs a syntax check, a stubbed module-load check, and a frontend-contract check for every API route used by the existing React application.

## Documentation

- `FRONTEND_API_CONTRACT.md` — exact routes, payloads, response shapes, authentication, and multipart fields consumed by the current frontend
- `FRONTEND_COMPATIBILITY_AUDIT.md` — audit findings, backend changes, verification results, setup, and smoke-test sequence

## Important deployment notes

- Use a MongoDB replica set and real transactions for stronger guarantees around multi-document case/report creation.
- Disable automatic index building in production and apply indexes through a deployment/migration process.
- Use a long random JWT secret and encryption key.
- Restrict `FRONTEND_URL` to trusted origins.
- Place Vercel/environment secrets in deployment settings, not files.
- Replace prototype/demo content with licensed or user-provided material only.
