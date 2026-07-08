# Backend Auth Middleware Audit — Changes Log

| # | Route File | Endpoint | Issue | Fix Applied |
|---|-----------|----------|-------|-------------|
| 1 | `src/modules/feedback/feedback.routes.js:7` | `GET /api/feedback/:eventId` | **Missing `auth` middleware** — Any unauthenticated user could list all feedback for any event, exposing potentially sensitive user reviews without restriction. | Added `auth` middleware to the route (now reads: `router.get('/:eventId', auth, controller.listForEvent)`) |

## Routes Verified as Correctly Protected

| Route File | Protection Method | Status |
|-----------|-------------------|--------|
| `auth.routes.js` | Public routes intentional; `/me` uses `auth` | ✅ |
| `user.routes.js` | `router.use(auth)` at top | ✅ |
| `event.routes.js` | Public discovery routes intentional; mutating routes use `auth` + `permit` | ✅ |
| `registration.routes.js` | `router.use(auth)` at top | ✅ |
| `attendance.routes.js` | `router.use(auth, permit('ORGANIZER', 'ADMIN'))` | ✅ |
| `certificate.routes.js` | `router.use(auth)` at top; `permit` on generate | ✅ |
| `admin.routes.js` | `router.use(auth, permit('ADMIN'))` | ✅ |
| `organizer.routes.js` | `router.use(auth, permit('ORGANIZER', 'ADMIN'))` | ✅ |
| `notifications.routes.js` | `router.use(auth)` at top | ✅ |
| `analytics.routes.js` | `router.use(auth, permit('ORGANIZER', 'ADMIN'))` | ✅ |
