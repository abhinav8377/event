# Changes Made — Frontend-Backend Integration

## Overview
Replaced the frontend mock API layer with real HTTP calls to the Express backend. Added missing backend endpoint and frontend features to fully connect all modules.

## Frontend Changes

### API Layer (src/api/) — All 8 files rewritten
- **authApi.ts** — `login`, `register`, `logout`, `me` now call real backend endpoints via axios
- **eventApi.ts** — All CRUD + search/upcoming/popular + organizer events mapped to backend with category transformation (TECH→Technology, etc.)
- **registrationApi.ts** — Register, cancel, my-events, event-registrations, get-ticket
- **attendanceApi.ts** — Verify attendance, manual check-in, event attendance list
- **certificateApi.ts** — My certificates, all certificates, download (PDF blob), generate
- **feedbackApi.ts** — Get/submit/delete feedback
- **notificationApi.ts** — Get notifications, mark read, mark all read
- **adminApi.ts** — Users, organizers, verify, block, stats, events, delete event
- **userApi.ts** (new) — Profile update, change password

### State Management
- **authSlice.ts** — Added `logoutUser` async thunk (calls POST `/api/auth/logout`), `updateProfile` async thunk (calls PATCH `/api/users/profile`), `changePassword` async thunk (calls PATCH `/api/users/change-password`). Logout buttons now invalidate tokens on the server.
- **notificationSlice.ts** — `fetchNotifications` now fetches from real backend. `markNotificationRead` / `markAllNotificationsRead` call real endpoints.

### New/Updated Pages
- **ProfilePage.tsx** — Added "Change password" section with current/new/confirm password fields
- **MyCertificates.tsx** — Download button now calls backend PDF endpoint with fallback to text download
- **OrganizerEvents.tsx** — Added "Certificates" button to generate certificates for published/completed events
- **AdminEvents.tsx** — Added "Delete" button with confirmation modal for admin event deletion
- **AttendancePage.tsx** — Rewrote to display real attendance records from backend (user name, email, check-in time, status)
- **NotificationsPage.tsx** — Added `useEffect` to fetch notifications on mount

### Configuration
- **vite.config.ts** — Added proxy `/api` → `http://localhost:5000` for dev
- **.env** (new) — `VITE_API_URL=/api`
- **package.json** (root, new) — `dev`, `seed`, `install:all` scripts using concurrently
- **Navbar.tsx** — Fixed `dashboardPath` to use `/user`, `/organizer`, `/admin` (not `/user/dashboard`). Logout now calls backend API.
- **DashboardLayout.tsx** — Logout now calls backend API

## Backend Changes

### New Endpoint
- **admin.routes.ts** + **admin.controller.ts** + **admin.service.ts** — Added `GET /api/admin/events` to list all events (any status) with organizer population

---

# Community Feature (Complete Community Workflow)

## Overview
Organizers can create per-event communities. Registered attendees request to join; organizers approve/deny from a
dedicated "Manage Community Members" panel; approved members chat in real time via Socket.IO (two-panel chat:
member list + live messages).

### Rules
- A community is tied 1:1 to an event (`eventId` unique).
- Only users with a CONFIRMED/ALLOWED registration for that event can request to join.
- Organizer is the community admin (APPROVED member) and can approve, deny, remove, or (for others) delete members.
- Approved members chat; leaving returns them to the community cards (conditional rendering, same route).

## Backend Changes
- **New module** `src/modules/communities/`:
  - `community.model.ts` — `Community` (eventId, organizerId, name, description)
  - `communityMember.model.ts` — `CommunityMember` (communityId, userId, status: PENDING|APPROVED|DENIED)
  - `communityMessage.model.ts` — `CommunityMessage` (communityId, senderId, message)
  - `community.service.ts` / `community.controller.ts` / `community.routes.ts`
- **routes** mounted at `/api/communities`:
  - `GET /my` — communities visible to a registered user
  - `GET /organizer/list` — organizer's communities (with pending/member counts)
  - `POST /` (ORGANIZER/ADMIN) — create community for an event
  - `POST /:communityId/join` — send join approval request
  - `GET /:communityId/members` (ORGANIZER/ADMIN) — list members + search filter
  - `PATCH /:communityId/members/:userId/approve` — approve
  - `PATCH /:communityId/members/:userId/deny` — deny
  - `DELETE /:communityId/members/:userId` — remove (organizer only)
  - `POST /:communityId/leave` — leave community (non-admin)
  - `GET /:communityId/chat` — chat data (community + members + history)
- **`src/types/index.ts`** — added `ICommunity`, `ICommunityMember`, `ICommunityMessage`, `CommunityMemberStatus`.
- **`src/socket.ts`** (new) — Socket.IO server; `community:join`, `community:leave`, `community:message` events.
  Auth via JWT from `auth.token`/query. Messages broadcast to room `community:<id>`.
- **`server.ts`** — creates HTTP server and attaches Socket.IO.
- **`app.ts`** — registers `communityRoutes`.
- **deps** — `socket.io` added to backend, `socket.io-client` to frontend. Vite proxy gained `/socket.io` (ws).

## Frontend Changes
- **`src/api/communityApi.ts`** + **`src/api/socket.ts`** (socket.io-client wrapper).
- **`src/constants/types.ts`** — `Community`, `CommunityMember`, `CommunityMessage`, `CommunityChatData`.
- **`src/pages/organizer/OrganizerCommunities.tsx`** — "Community" nav item; create community per event; "Manage Members" modal with search + approve/deny/remove.
- **`src/pages/user/UserCommunities.tsx`** — "Communities" nav item; cards for registered events only; "Join Community" → approval popup ("your request has been sent, wait for approval to join"); on approve "Join" becomes "Chat Now" (same route, conditional render); two-panel chat (member list + live messages) with Leave / Close Chat returning to cards.
- **`src/App.tsx`** — routes `/organizer/communities`, `/user/communities` + nav items.

## Running the Project

```bash
# From root directory
npm run dev        # Starts backend (port 5000) + frontend (port 3000) concurrently
npm run seed       # Seeds MongoDB with demo data
```

### Demo Credentials (after seeding)
| Role       | Email                     | Password    |
|-----------|---------------------------|-------------|
| Admin     | admin@eventplatform.dev   | password123 |
| Organizer | organizer@techevents.com  | password123 |
| User      | john.doe@example.com      | password123 |
