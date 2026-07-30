# Frontend API Contract

This document records the API contract used by the existing React frontend. The frontend was treated as the source of truth and was not modified.

Base URL used by the frontend:

```text
http://localhost:8080
```

All product endpoints are under `/api`. Browser requests use `credentials: "include"`, so local CORS must allow `http://localhost:3000` and cookies.

## Response rules

Successful responses use:

```json
{
  "success": true,
  "message": "Human-readable success message.",
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "message": "Clear description of the problem.",
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "details": null
  }
}
```

The frontend treats any truthy `error` value, `success: false`, or non-2xx HTTP status as failure. Collection endpoints therefore return arrays in `data`, including an empty array when no records exist.

## Authentication and legacy user routes

| Method | Path | Frontend purpose |
|---|---|---|
| POST | `/api/signup` | Create an account from `{name,email,password,confirmPassword,profilePic}` |
| POST | `/api/signin` | Sign in using `{email,password}` and set HTTP-only cookies |
| GET | `/api/user-details` | Load the current authenticated user |
| POST | `/api/forgot-password` | Request password-reset instructions |
| GET | `/api/verify-reset-token/:token` | Validate the reset link |
| POST | `/api/reset-password` | Reset with `{token,password}` |
| GET | `/api/userLogout` | Clear the current browser session |
| GET | `/api/all-user` | ADMIN: return a plain user array, without required pagination |
| POST | `/api/user-search` | ADMIN: search by `{email}` |
| POST | `/api/update-user` | ADMIN: update using body `userId` plus changed fields |
| POST | `/api/update-profile` | Update the signed-in user using the existing profile payload |
| POST | `/api/delete-user` | ADMIN: deactivate the account identified by body `userId` |

Passwords of 6 or more characters are accepted because both current signup and reset-password screens enforce six characters. New passwords are stored in `passwordHash`. A valid legacy bcrypt value stored in `password` is migrated after a successful sign-in.

## Public product routes

| Method | Path | Response data |
|---|---|---|
| GET | `/api/archive` | Array of flattened published archive records |
| GET | `/api/archive/:id` | One flattened published archive record |
| GET | `/api/stories` | Array of published story/testimony cards |
| GET | `/api/stories/:id` | One published story/testimony |
| GET | `/api/timeline` | Array of published event timeline entries |
| GET | `/api/missing-persons` | Array of verified public missing-person profiles |
| GET | `/api/missing-persons/:id` | One verified public profile; ADMIN receives private nested detail |

Public archive objects include the exact fields consumed by the UI: `id`, `_id`, `type`, `verified`, `status`, `title`, `titleEn`, `description`, `summary`, `body`, `date`, `eventDate`, `location`, `contributor`, `attribution`, `image`, `thumbnail`, `tags`, `verificationNote`, `source`, `sensitive`, and `contentWarning`.

Public missing-person objects include `id`, `_id`, `name`, `age`, `lastSeenLocation`, `lastSeenDate`, `verified`, `image`, `photo`, `clothing`, `description`, and `status`.

## User documentary submission routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/submissions` | Create a private submission using multipart field `files` |
| GET | `/api/submissions/my` | Return the current user's submission cards |
| GET | `/api/submissions/:id` | Return one owned submission |
| POST | `/api/submissions/drafts` | Save the frontend draft metadata |

The backend accepts the current form fields without renaming them:

```text
title, summary, storyText, eventDate, location, sourceType, sourceNotes,
identityPreference, pseudonym, publicationPermission, archiveVisibility,
removeMetadata, redactNames, protectFaces, protectVoices, allowAdminContact,
consent, accuracy, privacyConfirmed, type, contentTypes, privacyControls
```

`contentTypes` and `privacyControls` may arrive as JSON strings inside multipart form data. Up to 20 evidence files are accepted through repeated `files` fields. Each file can be up to the configured 250 MB limit and combined size is checked against 1 GB. Temporary uploads are disk-backed rather than stored in Node.js memory.

User submission cards return `id`, `_id`, `title`, `type`, `contentTypes`, `attachmentCount`, `identity`, `publicAttribution`, `publicationPermission`, `visibility`, `status`, `updatedAt`, and `createdAt`.

## User support routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/support/requests` | Create a private support request with repeated `documents` |
| GET | `/api/support/rooms` | Return the user's support-room cards |
| GET | `/api/support/rooms/:roomId` | Return `{room,messages}` |
| POST | `/api/support/rooms/:roomId/messages` | Send `message` and optional multipart `file` |

The request accepts `requesterName`, `relationship`, `category`, `urgency`, `location`, `hospital`, `description`, `contact`, and `consent` exactly as sent by the UI.

Room cards return `id`, `_id`, `title`, `status`, `priority`, `category`, `updatedAt`, `assignedAdmin`, and `unread`. Message objects return `id`, `sender`, `name`, `text`, `time`, and optional `attachment`.

## Missing-person routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/missing-persons/reports` | Submit report with optional multipart `photo` |
| GET | `/api/missing-persons/reports/my` | Return the signed-in user's reports |
| POST | `/api/missing-persons/:id/sightings` | Submit a private sighting |
| GET | `/api/missing-persons/admin` | ADMIN: review queue |
| PATCH | `/api/missing-persons/:id/status` | ADMIN: change report status |
| PATCH | `/api/missing-persons/:id/assign` | ADMIN: assign reviewers |
| PATCH | `/api/missing-persons/:reportId/sightings/:sightingId/status` | ADMIN: review sighting |

The report accepts `name`, `age`, `relationship`, `lastSeenDate`, `lastSeenLocation`, `clothing`, `description`, `reporterContact`, `visibilityConsent`, and `declaration`. A photo is optional because the frontend permits submission without one.

ADMIN detail responses retain the exact nested structure used by the UI:

```json
{
  "report": {
    "person": {},
    "lastSeen": {},
    "profileMediaId": {}
  },
  "privateDetails": {
    "reporterDetails": {},
    "missingPersonDetails": {}
  },
  "sightings": []
}
```

## Administrator product routes

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard `stats` and `recentActivity` |
| GET | `/api/admin/submissions` | Documentary review queue |
| POST | `/api/admin/submissions/:id/review` | Approve, reject, source-check, or request information |
| GET | `/api/admin/support-cases` | Support-case review cards |
| GET | `/api/admin/support-cases/:id` | Full support case, documents, messages, and progress |
| POST | `/api/admin/support-cases/:id/messages` | Send an administrator reply |
| POST | `/api/admin/support-cases/:caseId/documents/:documentId/verify` | Verify or reject a medical document |
| GET | `/api/admin/archive` | Publication queue |
| POST | `/api/admin/archive/:id/publish` | Publish or unpublish the selected record |

The documentary review endpoint accepts the current UI values `approve`, `reject`, `source_checked`, and `request_information`. Approval creates a draft archive item and, when an event date exists, a verified timeline event. Publication then updates the public item, source submission, event, and media visibility.

## Authentication rules

- Browser cookie authentication and `Authorization: Bearer <token>` are both supported.
- All user product routes require an active account.
- All administrator routes verify the current database role; the role in the token alone is not trusted.
- Refresh tokens are hashed in `auth_sessions` and rotated.
- Unsafe cookie-authenticated requests are checked against `FRONTEND_URL`.

## File field names

| Feature | Multipart field | Limit |
|---|---|---|
| Documentary evidence | `files` | 20 files, 250 MB each, 1 GB combined |
| Support documents | `documents` | 6 files, 10 MB each |
| Support message attachment | `file` | 1 image/PDF, 10 MB |
| Missing-person profile photo | `photo` | 1 image, 10 MB |

All uploaded files are sent to Cloudinary and recorded in `media_assets` with a SHA-256 checksum. Private production delivery still requires an authenticated/private Cloudinary delivery configuration.
