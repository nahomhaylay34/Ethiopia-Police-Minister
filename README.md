# Crime Management System (CMS)

A full‑stack web application for citizen reporting and law‑enforcement case management. The system provides role‑based portals for citizens, officers/detectives, and administrators, with evidence handling, messaging, notifications, analytics, and auditing.

## Overview

- Citizen users submit and track crime reports and receive notifications.
- Officers/Detectives manage cases, update statuses, add notes/charges, and communicate.
- Administrators monitor operational performance with dashboards, manage users, review audit logs, and broadcast announcements.

## Tech Stack

- Frontend
  - React 19, TypeScript 5
  - Vite 8 (dev/build), React Router 7
  - Tailwind CSS 4 + DaisyUI 5
  - Axios for HTTP
  - Icons: Heroicons (24/outline). For stability, critical icons are inlined as SVGs in sensitive views to avoid bundler import issues.
- Backend
  - Node.js, Express 5
  - Sequelize 6 (ORM) with MySQL (mysql2)
  - JWT auth (jsonwebtoken), bcryptjs for password hashing
  - Security: Helmet, CORS, rate limiting
  - Validation: express-validator / Joi (validators in routes)
  - Email (optional): nodemailer (SMTP credentials via environment)
  - Logging: morgan (dev), winston (available)
  - Configuration: dotenv

## Monorepo Structure

```
cms/
├─ backend/
│  ├─ src/
│  │  ├─ app.js                  # Express app wiring, global middlewares, routes, errors
│  │  ├─ server.js               # Server bootstrap, DB sync, process handlers
│  │  ├─ config/
│  │  │  ├─ config.js            # Env-based configuration (DB, JWT, CORS, etc.)
│  │  │  └─ database.js          # Sequelize instance
│  │  ├─ models/                 # Sequelize models (User, Report, Case, Evidence, AuditLog, etc.)
│  │  ├─ controllers/            # Business logic (authController, adminController, ...)
│  │  ├─ routes/                 # API routers (auth, reports, cases, admin, ...)
│  │  ├─ middleware/             # authenticate, authorize, auditLogger, error handler
│  │  ├─ utils/                  # tokens, email, encryption, error helpers
│  │  └─ seeds/                  # seedInitialUsers.js (creates admin/officer if missing)
│  └─ package.json
└─ frontend/
   ├─ src/
   │  ├─ App.tsx / AppRouter.tsx # Router with role-based ProtectedRoute
   │  ├─ components/             # Sidebar, Header, DashboardLayout, etc.
   │  ├─ pages/                  # Landing, Login, Register, dashboards, reports, cases, messages, etc.
   │  ├─ context/                # AuthContext/AuthProvider
   │  ├─ hooks/                  # useAuth
   │  └─ services/api.ts         # Axios instance, endpoints, interceptors
   ├─ vite.config.ts
   ├─ tsconfig*.json
   └─ package.json
```

## Core Features by Role

- Citizen
  - Register, login, view profile.
  - Submit crime reports (with optional evidence upload and anonymous option), track status.
  - Receive notifications and messages.
- Officer/Detective
  - Role‑based dashboard with open cases and workload.
  - Create, view, update cases; assign, add notes/charges; merge cases; view timelines.
  - Messaging with citizens/other staff; notifications center.
- Administrator
  - Admin dashboard with:
    - Overview stats (reports, cases, officers, performance).
    - Crime distribution by type.
    - Officer load and efficiency summary.
    - System alerts table.
    - Audit logs feed.
  - User management (list, create, update users).
  - Announcements broadcast to roles.
  - Data export (reports CSV).

## Frontend Application

- Routing and Guards
  - ProtectedRoute enforces authentication and optional role gates.
  - RoleRedirect routes users to `/dashboard/admin`, `/dashboard/officer`, or `/dashboard/citizen`.
  - Main routes under `/dashboard` render via DashboardLayout (Sidebar/Header + Outlet).
- Auth
  - Token persisted in `localStorage`.
  - AuthProvider fetches `/auth/me` on startup when token exists and exposes `login/logout`.
  - Axios interceptor attaches `Authorization: Bearer <token>`; on `401/403` the token is cleared and the user is redirected to `/login`.
- Styling/UI
  - TailwindCSS + DaisyUI components. Icons use Heroicons (with inlined SVGs in critical views for bundler reliability).
- Key Pages
  - LandingPage: marketing content + quick report section.
  - LoginPage, RegisterPage.
  - Dashboard pages:
    - AdminDashboardPage: KPIs, distribution, officer load, alerts, audit logs, date range filter, data refresh.
    - OfficerDashboardPage: workload and cases overview.
    - DashboardPage (Citizen): citizen-centric overview.
  - Reports: list, details, new report form with evidence upload.
  - Cases: list, details with timeline and note adding.
  - Messages, Notifications, Process Criminals (officer/detective).

## Backend API (Selected)

Base URL: `http://localhost:5000/api/v1`

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`
  - `POST /auth/refresh-token`
  - `GET /auth/me` (auth required)
  - `GET /auth/verify` and `GET /auth/verify/:token`
- Reports
  - `POST /reports` (auth; create report)
  - `GET /reports` (auth; list with filters: status, crime_type, urgency_level)
  - `GET /reports/:id` (auth)
  - `PUT /reports/:id/status` (auth + role officer/detective/admin)
  - `DELETE /reports/:id` (admin)
- Evidence
  - `POST /evidence/upload` (multipart form-data)
  - `GET /evidence/:id`
  - `DELETE /evidence/:id`
- Cases
  - `POST /cases` (roles: admin/detective/officer)
  - `GET /cases`
  - `GET /cases/:id`
  - `PUT /cases/:id` (roles: admin/detective/officer)
  - `POST /cases/:id/charges`
  - `POST /cases/:id/assign` (detective/admin)
  - `POST /cases/:id/notes` (detective/officer/admin)
  - `POST /cases/merge` (detective/admin)
  - `GET /cases/:id/timeline`
- Messages
  - `POST /messages/send`
  - `GET /messages/conversations`
  - `GET /messages/conversations/:userId`
  - `GET /messages/users` (search)
  - `PUT /messages/:id/read`
- Notifications
  - `GET /notifications`
  - `GET /notifications/unread-count`
  - `PUT /notifications/:id/read`
  - `PUT /notifications/read-all`
- Admin
  - Dashboard analytics:
    - `GET /admin/dashboard/stats?date_range=today|week|month|year`
    - `GET /admin/dashboard/trends`
    - `GET /admin/dashboard/crime-distribution?date_range=...`
    - `GET /admin/dashboard/status-distribution?date_range=...`
    - `GET /admin/dashboard/officer-load?date_range=...`
    - `GET /admin/dashboard/alerts?limit=...`
  - `POST /admin/export` (reports CSV)
  - `GET /admin/audit-logs?limit=...&page=...`
  - Users:
    - `GET /admin/users`
    - `POST /admin/users` (admin can create officer/detective/admin; email verification optional)
    - `PUT /admin/users/:id`
  - `POST /admin/announcements`

All admin routes are protected by `authenticate` + `authorize('admin')`.

## Data Model (Summary)

- User
  - UUID id, email (unique), password_hash (bcrypt), full_name, role (`citizen|officer|detective|admin`), is_verified, is_locked, phone, national_id (encrypted), address, timestamps.
- Report
  - UUID id, user_id (nullable for anonymous), title, description, crime_type enum (theft, assault, burglary, fraud, cybercrime, vandalism, missing person, other), location, urgency_level enum, status enum, occurrence_date, coordinates (optional).
- Case
  - UUID id, case_number (unique), title, description, assigned_to (user id), status enum (open, investigation, awaiting_approval, closed), priority enum, suspect info, opened_at, closed_at.
- Evidence
  - file_url, type, size (linked to report).
- AuditLog
  - UUID id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, timestamps; belongsTo User.
- Notification, Message, CaseUpdate, Alert, AlertRule, PerformanceMetric, ExportJob (supporting domain ops).

## Security

- JWT-based authentication on protected routes.
- Role-based authorization middleware for sensitive actions.
- Helmet for secure headers; rate limiting on `/api`.
- CORS configured for `http://localhost:3000` and `http://localhost:5173` by default (override via env).
- Passwords stored as bcrypt hashes; sensitive PII (e.g., national_id) encrypted at rest.

## Setup & Running Locally

### Prerequisites

- Node.js (LTS recommended)
- MySQL 8.x (or compatible), with a database created (default name: `cms`)

### Backend

1. `cd backend`
2. `npm install`
3. Create `.env` (or rely on defaults in `src/config/config.js`):
   - `PORT=5000`
   - `DB_HOST=localhost`
   - `DB_PORT=3306`
   - `DB_USER=root`
   - `DB_PASSWORD=your_password`
   - `DB_NAME=cms`
   - `JWT_SECRET=super-secret`
   - `CORS_ORIGIN=http://localhost:3000,http://localhost:5173`
   - Optional email:
     - `EMAIL_HOST=smtp.gmail.com`
     - `EMAIL_PORT=465`
     - `EMAIL_SECURE=true`
     - `EMAIL_USER=...`
     - `EMAIL_PASS=...`
4. Start in dev: `npm run dev` (nodemon). Tables are auto‑created via `sequelize.sync()` on boot.
5. Seed initial users (admin + officer/detective if missing): `npm run seed`
   - Default admin: `admin2@cms.com` / `admin123456`

### Frontend

1. `cd frontend`
2. `npm install`
3. Development server: `npm run dev` (default port 3000; see `vite.config.ts`)
4. Open `http://localhost:3000`

### Lint & Build

- Frontend:
  - Lint: `npm run lint`
  - Production build: `npm run build` (TypeScript build + Vite)
- Backend:
  - Dev only scripts (`npm run dev`). Add your own lint/test scripts as needed.

## Admin Dashboard Details

- Date range quick filters: Today, Week, Month, Year.
- Overview metrics:
  - Reports: total/pending/investigating/resolved/closed + percentage deltas.
  - Cases: total/open/closed, average resolution days.
  - Officers: total/active, average case load.
  - Performance: resolution rate, citizen satisfaction, average response time.
- Crime distribution:
  - Top categories with counts, percentages, trend arrows, color mapping.
- System alerts:
  - Recent alerts with severity, type, title, status, and timestamps.
- Officer load & efficiency:
  - Per‑officer active cases, efficiency radial indicator, overload status.
- Urgency breakdown:
  - Emergency/High/Medium/Low counts.
- Audit logs:
  - Latest system actions with actor, action type, details, and time.

## Troubleshooting

- Vite overlay indicates import resolution errors (e.g., heroicons):
  - Use inlined SVGs for icons in critical pages or ensure subpath imports resolve to ESM files your bundler supports.
- “Some dashboard sections failed to load”:
  - Indicates one or more admin endpoints returned an error. Retry. If persistent, check backend logs and DB state. Ensure model associations are defined for any included relations (e.g., `AuditLog.belongsTo(User)`).
- 401/403 loops:
  - The frontend interceptor clears the token and redirects to `/login`. Ensure your admin account is seeded and credentials are correct.

## Notes & Next Steps

- Realtime updates are planned (socket.io). The client dependency exists; the server endpoints can be augmented to broadcast events for alerts/notifications.
- Extend Admin Create User form to include `phone`, `national_id`, and `address` to match backend validation rules.
- Consider adding tests and CI for lint/build/type checks.

---

© 2026 CMS Ethiopia — All rights reserved.


## Account Roles & Capabilities

- Citizen
  - Register and verify account; login and manage session.
  - Submit crime reports with optional evidence uploads; report anonymously or as a verified user.
  - Track report status through the lifecycle (pending, under_review, investigating, resolved, closed).
  - Receive and view notifications; mark notifications as read.
  - View and participate in message conversations with officers/detectives when applicable.
  - Access a citizen-focused dashboard with quick actions and recent activity.

- Officer
  - Access the officer dashboard showing assigned/open cases and workload indicators.
  - Create new cases when appropriate; update case details and status of assigned cases.
  - Add case notes and charges; attach updates to case timelines.
  - Collaborate with detectives and admins on investigations; process suspects (process criminals flow).
  - Send and receive messages; manage notifications.
  - View reports relevant to their unit and open workload.

- Detective
  - All officer capabilities, plus advanced case management.
  - Assign cases to officers/detectives within their scope.
  - Merge related cases; manage case priorities and escalation paths.
  - Lead investigations, coordinate workload distribution with admins, and track resolution metrics.
  - Engage in secure messaging with officers and citizens when appropriate; manage notifications.

- Administrator
  - Full system access with role-based protections on sensitive actions.
  - Monitor system health and performance via the Admin Dashboard:
    - Overview KPIs, crime distribution, urgency breakdown, officer load, performance metrics.
    - System alerts panel with severity and status.
    - Audit logs feed for compliance and traceability.
  - Manage users: list, create (officer/detective/admin), and update user accounts.
  - Export report data in CSV for analysis and reporting.
  - Broadcast announcements to target roles (citizen, officer, detective).
  - Configure and oversee security and operational policies in coordination with backend settings.
now everything is working as it should remmeber this point if something faile and tell you to return to checkpoint you need to return to this point of version , right now i want you to make sure when a new case is created athe system should assign case numbers and case are created by officer not citizens . cirizens can only report possible crime or case the officer will verify them and create a case . in the case form the their will be a place for unique case identifier, title, detailed description, crime type, priority level, and the date and location of the incident, including optional geographic coordinates. Each case is assigned to a responsible officer and maintains a status reflecting its progress, such as open, under investigation, awaiting court, or closed. Rather than storing personal details directly, the case links to one or more suspects, where each suspect has a separate profile containing their full name, national identification number, photograph, contact details, and criminal status. The case also includes associated evidence records, which may consist of images, videos, documents, or witness statements, each with metadata such as type, description, uploader, and timestamps, along with a chain of custody for integrity tracking