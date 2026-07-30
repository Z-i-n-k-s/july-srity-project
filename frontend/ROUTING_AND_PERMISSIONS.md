# Routing and Permission Model

The project uses the same nested `createBrowserRouter` pattern as the original frontend:

- `App` is the root layout and renders an `Outlet`.
- `RootRedirect` sends guests to `/login`, users to `/home`, and administrators to `/admin-panel`.
- `GuestRoute` keeps authenticated users away from login, signup, forgot-password and reset-password pages.
- `ProtectedRoute` checks the Redux session and optionally checks `allowedRoles`.
- The protected `/admin-panel` parent route guards every nested administrator page.

## Roles

Backend role values are normalised to uppercase before comparison.

```text
USER
ADMIN
```

An authenticated account with no role field is treated as `USER` for frontend compatibility. The backend must still return and enforce the real role.

## Guest-only routes

```text
/login
/sign-up
/forgot-password
/reset-password/:token
```

## Shared authenticated routes

Accessible to both `USER` and `ADMIN`:

```text
/home
/archive
/archive/:id
/timeline
/stories
/stories/:id
/support
/missing-persons
/missing-persons/:id
/about
```

## User-only routes

```text
/submit
/support/new
/missing-persons/report
/wallets
/account
/account/submissions
/account/support-rooms
/account/support-rooms/:roomId
/account/reports
/account/drafts
/account/profile
```

An administrator who opens a user-only route is redirected to `/admin-panel`.

## Administrator-only routes

```text
/admin-panel
/admin-panel/submissions
/admin-panel/support-cases
/admin-panel/support-cases/:caseId
/admin-panel/missing-reports
/admin-panel/archive-manager
/admin-panel/all-users
/admin-panel/settings
```

A normal user who opens an administrator route is redirected to `/home`. A guest is redirected to `/login` while the requested URL is stored in router state.

## Security boundary

Frontend routing is only a UI guard. The backend must independently enforce authentication, role checks and ownership for every request, especially:

```text
/api/admin/*
/api/submissions/*
/api/support/*
/api/missing-persons/*
```
