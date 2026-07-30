# Frontend Update Notes

## Admin panel

- User deletion now uses an explicit confirmation modal with account identity, cancel, loading and destructive-action states.
- Overview polls dashboard, submissions, support rooms, missing reports and archive records every 12 seconds while visible.
- Overview includes live actionable notifications, active work counts, synchronization time and queue links.
- Support administration is presented as a messenger-style workspace with a left room list, selected conversation, sticky composer and frontend status controls.
- Stopping a room requires a reason and confirmation. The room remains readable and messaging is disabled in admin and user views.
- Frontend room removal hides a room from the current browser's admin view without claiming to delete backend data.
- Missing-person review includes four guided steps: reporter and consent, person and last-seen details, sightings, and final decision.
- Individual sightings can be verified or rejected through the existing API helper.

## Private user data

- My Submissions, My Reports, User Dashboard, Support Rooms and direct Support Room routes apply ownership checks before rendering.
- Local records and drafts are stamped with owner ID/email when created.
- Legacy unowned local records are no longer automatically treated as belonging to whichever account is currently signed in.
- Direct navigation to a support room that is not owned by the current account is blocked.

## Public archive controls

- Public archive lists and detail routes show only records with an explicit public status or approved static editorial records.
- Pending, rejected, private, disabled and unpublished records are hidden.
- An explicit Unpublished/Disabled status overrides an older `verified: true` flag.
- Public missing-person pages no longer fall back to demo profiles and show only verified/public records.

## Historical content architecture

- Hero Stories and Aynaghor are separate pages and separate navigation entries.
- A new July Chapters page contains static, source-aware chapters for 5 August 2024, the internet blackout, offline communication, state/security response, martyrs and badly injured people, former government figures and statements, the initial interim advisory council, social-memory posts and graffiti.
- The date is presented as 5 August 2024. “Independence 2.0” is labelled as a popular description, not Bangladesh's official Independence Day.
- Timeline cards alternate left and right on desktop and remain a single readable column on mobile.

## Important frontend-only limitation

The support-room stop state is intentionally frontend-only and stored in browser local storage, as requested. It is visible when admin and user views use the same browser storage. Cross-device synchronization and enforceable authorization still require backend persistence and access checks.
