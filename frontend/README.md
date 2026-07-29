# July Smriti Archive — Complete User and Admin Frontend

A React/Create React App frontend for a privacy-first documentary archive, injured-person support workflow, verified missing-person information and administrator review system.

## What is included

### User experience

- Dark documentary landing page with cinematic slider, archive previews, timeline, stories, support, missing-person and verification sections.
- Existing authentication routes and fetch-based backend connection preserved.
- Universal evidence submission for written testimony, stories, photographs, videos, audio, PDF, Word and text documents.
- Multi-file preview, drag/drop, file removal, validation and local draft saving.
- Identity controls: anonymous, pseudonym or public name.
- Privacy controls: metadata removal request, name/contact redaction, face protection, voice protection and publication permission.
- Every submission starts private and pending administrator review.
- Private support requests with protected image/PDF uploads.
- Support Rooms with user/admin messages, image preview, PDF cards and case progress.
- Missing-person report image preview and private possible-sighting reports.
- Archive, story, timeline and missing-person pages load from backend endpoints with local demo fallback.
- Account dashboard, submissions, support rooms, reports, drafts and profile pages.
- English/Bangla language switch across navigation, authentication, major landing content, user pages and admin UI.

### Administrator experience

- Role-protected `/admin-panel` routes.
- Dashboard totals and review queues.
- Review mixed evidence, stories and documentary uploads.
- Preview protected images, videos and document files returned by the backend.
- Approve, reject, source-check or request more information.
- Confirm privacy processing before approval.
- Review support cases, answer users and preview selected attachments.
- Verify or reject requested medical documents without publishing them.
- Review missing-person reports and approve only safe public fields.
- Manage public archive derivatives, publishing, unpublishing and correction notes.
- Existing all-users management retained and restyled.

## Technology

- React 18
- Create React App / `react-scripts`
- React Router 6
- Redux Toolkit
- Tailwind CSS 3
- Framer Motion
- Lucide React and React Icons
- Native `fetch` with cookie credentials

## Start

```bash
npm install
cp .env.example .env
npm start
```

Production build:

```bash
npm run build
```

## Environment

```env
REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_DEMO_FALLBACK=false
```

Use `REACT_APP_DEMO_FALLBACK=false` when testing real backend validation. With fallback enabled, list pages can continue displaying demonstration content while an endpoint is unavailable.

## Routing and permissions

The original nested `createBrowserRouter` structure is preserved and extended through a single role-aware `ProtectedRoute`.

- Guests are redirected to `/login`.
- Normal users are redirected to `/home`.
- Administrators are redirected to `/admin-panel`.
- User-only pages accept `USER`.
- Administrator pages accept `ADMIN`.
- Shared archive pages accept both roles.

The original route names remain available, including `/home`, `/wallets`, and `/admin-panel/all-users`. Full route and permission details are documented in [`ROUTING_AND_PERMISSIONS.md`](./ROUTING_AND_PERMISSIONS.md).

## Backend connection

Existing authentication endpoint names in `src/common/index.js` were not replaced. New endpoint definitions follow the same pattern. Shared fetch helpers are in `src/lib/api.js`.

All authenticated requests use:

```js
credentials: "include"
```

### Universal evidence form

`POST /api/submissions` as `multipart/form-data`.

Repeated file field:

```text
files
```

Important text fields include:

```text
title
summary
storyText
eventDate
location
sourceType
sourceNotes
type
contentTypes            JSON array
identityPreference
pseudonym
publicationPermission
archiveVisibility
privacyControls         JSON object
removeMetadata
redactNames
protectFaces
protectVoices
allowAdminContact
consent
accuracy
privacyConfirmed
```

The backend must store original files privately. It must never publish an original upload automatically. Public archive content should be a separate admin-approved and privacy-processed derivative.

### Support requests

`POST /api/support/requests` as `multipart/form-data`.

Repeated private document field:

```text
documents
```

The UI accepts images and PDF files up to 10 MB each. Medical documents must be accessible only to the requester and authorised support administrators.

### Support messages

User:

```text
POST /api/support/rooms/:roomId/messages
```

Admin:

```text
POST /api/admin/support-cases/:caseId/messages
```

Payload is `multipart/form-data` with `message` and optional `file`. Return a protected attachment object when possible:

```json
{
  "success": true,
  "data": {
    "attachment": {
      "name": "requested-document.jpg",
      "type": "image/jpeg",
      "size": 218934,
      "url": "short-lived-signed-url"
    }
  }
}
```

### Missing-person report

`POST /api/missing-persons/reports` as `multipart/form-data` with optional image field `photo`.

Possible sightings:

```text
POST /api/missing-persons/:personId/sightings
```

Sightings, reporter contacts and exact notes remain private until verified.

### Admin review actions

```text
GET  /api/admin/dashboard
GET  /api/admin/submissions
POST /api/admin/submissions/:id/review
GET  /api/admin/support-cases
GET  /api/admin/support-cases/:id
POST /api/admin/support-cases/:id/messages
POST /api/admin/support-cases/:caseId/documents/:documentId/verify
GET  /api/admin/missing-reports
POST /api/admin/missing-reports/:id/review
GET  /api/admin/archive
POST /api/admin/archive/:id/publish
```

The backend must enforce administrator roles for every `/api/admin/*` route. Frontend route protection is only a UI safeguard.

## Protected-file preview

Admin preview components expect the backend to return short-lived signed URLs or an authenticated streaming endpoint. Never expose permanent public URLs for original evidence, identity documents or medical files.

## Local images

Safe placeholder SVG assets are in `public/images`. Replace them with user-provided or properly licensed images while keeping the same filenames or updating `src/data/landingData.js`.

## Important privacy rules

- Raw submissions are private by default.
- Admin approval is mandatory before publication.
- Approval must not publish original files directly.
- Contributor contact information must never appear on public records.
- Pseudonyms and anonymity must be enforced server-side.
- Metadata removal, face protection and voice protection require backend/media processing.
- Medical documents and support conversations must never enter the public archive.
- Missing-person sightings must remain private until separately verified.
