# Event Discovery & Management System (MVP)

A centralized MERN platform where verified organizations create and manage events, and users discover, register, attend (QR check-in), receive certificates, and give feedback.

## Tech Stack

- **Frontend:** React, React Router, Redux Toolkit, Vite
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT + bcrypt with RBAC (USER / ORGANIZER / ADMIN)
- **Extras:** QRCode tickets, PDFKit certificates, Nodemailer notifications

## Getting Started

```bash
# 1. Install backend deps
npm install

# 2. Install client deps
npm install --prefix client

# 3. Configure environment
cp .env.example .env   # then edit values

# 4. Seed the database with demo data (optional)
npm run seed

# 5. Run both servers (API :5000, client :5173)
npm run dev
```

### Demo Credentials (after seeding)

- **Admin:** admin@eventplatform.dev / password123
- **Organizer:** organizer@techevents.com / password123
- **User:** john.doe@example.com / password123

## Module Overview

| Module        | Responsibility                              |
| ------------- | ------------------------------------------- |
| auth          | Register, Login, JWT, Forgot/Reset password |
| users         | Profile management                          |
| organizer     | Organizer dashboard, event registrations    |
| admin         | Platform management, organizer verification |
| events        | Event CRUD, publish/cancel, discovery       |
| registrations | Join event, QR ticket generation            |
| attendance    | QR verification, check-in                   |
| certificates  | PDF certificate generation and download     |
| feedback      | Ratings and reviews                         |
| notifications | In-app + email alerts                       |
| analytics     | Views, registrations, attendance, ratings   |

## API Base Routes

`/api/auth` `/api/users` `/api/events` `/api/registrations` `/api/attendance` `/api/certificates` `/api/feedback` `/api/notifications` `/api/analytics` `/api/organizer` `/api/admin`

All responses follow a consistent shape:

```json
{ "success": true, "message": "...", "data": {} }
```

## Database Seeding

To populate the database with demo data, run:

```bash
npm run seed
```

This will create:

- **3 Roles:** USER, ORGANIZER, ADMIN
- **10 Users:** 1 admin, 3 organizers, 6 regular users
- **10 Events:** Mix of upcoming, past, draft, and cancelled events across different categories
- **16 Registrations:** Users registered for various events
- **4 Attendance Records:** For past events
- **2 Certificates:** Issued to attendees
- **4 Feedback Entries:** Event reviews and ratings
- **15 Notifications:** Various notification types

**Note:** This will clear all existing data before seeding.
