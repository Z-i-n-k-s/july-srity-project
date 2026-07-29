# Backend Integration Checklist

## Authentication

- [ ] Existing signup, signin, current-user, logout and password-reset responses include `success`, `message` and `data` consistently.
- [ ] Cookies use appropriate `httpOnly`, `sameSite`, `secure` and CORS settings.
- [ ] Current-user data includes `_id` or `id`, `name`, `email`, `profilePic` and `role`.
- [ ] Every admin endpoint verifies `role === "ADMIN"` on the server.
- [ ] Normal user-only endpoints reject administrator-only or unauthenticated misuse according to your backend policy.
- [ ] The current-user endpoint returns the authoritative role used by the Redux session and route guards.

## Evidence and identity protection

- [ ] `POST /api/submissions` accepts mixed files using repeated field `files`.
- [ ] Server validates extension, MIME signature, size and file count.
- [ ] Original files are stored in private storage.
- [ ] Submission status starts as `Pending admin review`.
- [ ] `identityPreference`, `pseudonym`, `publicationPermission` and `archiveVisibility` are stored.
- [ ] Public attribution never falls back to the account name when Anonymous is selected.
- [ ] Metadata-removal, redaction, face-protection and voice-protection requests are visible to reviewers.
- [ ] Public archive receives a separate redacted/processed derivative, not the original file.
- [ ] Review decisions and corrections are written to an audit log.

## Support

- [ ] Support request creates a private case and room.
- [ ] Only requester and authorised admins can read the room.
- [ ] Image and PDF attachments return short-lived protected URLs.
- [ ] Medical document verification records reviewer, timestamp, status and note.
- [ ] Admin messages are persisted and delivered to the user room.
- [ ] National ID and unrelated medical-document uploads are rejected or flagged.

## Missing persons

- [ ] Reports remain private until approval.
- [ ] Reporter contact and relationship are never included in public responses.
- [ ] Possible sightings are stored separately and remain private.
- [ ] Admin can request more information, approve safe public fields or reject a report.
- [ ] Public image is a reviewed derivative.

## Response shape

List endpoints can return either:

```json
{ "success": true, "data": [] }
```

or:

```json
{ "success": true, "results": [] }
```

Detail endpoints can return:

```json
{ "success": true, "data": { "id": "..." } }
```

Errors should return an appropriate HTTP status and:

```json
{ "success": false, "error": true, "message": "Clear user-safe message" }
```
