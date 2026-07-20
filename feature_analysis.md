# CampusFlow — Feature Analysis & Roadmap

## Feature Inventory & Completion State

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | **Complete** — Fully functional, both backend and frontend |
| ⚠️ | **Partial** — Core logic works but has gaps or missing sub-features |
| ❌ | **Not Implemented** — Referenced or expected but not built |

---

### 1. Authentication & Session Management

| Feature | State | Details |
|---------|-------|---------|
| User Registration | ✅ | Email + password, Zod validation, bcrypt hashing. Role locked to STUDENT for security. |
| Login / Logout | ✅ | JWT access tokens (15 min) + httpOnly refresh cookie (7 days). |
| Token Refresh & Rotation | ✅ | **Production-grade** — concurrent request queuing on the frontend, full rotation with theft detection on the backend. Reusing a revoked token nukes all user sessions. |
| Session Restore on Reload | ✅ | Frontend auto-refreshes token on mount, restores user state seamlessly. |
| Password Change | ✅ | Fully supported with changePassword endpoints and forms on the profile page. |
| Forgot Password / Reset | ✅ | Stateless JWT resets; ResetPassword page and Forgot Password dialog links integrated. |
| Email Verification | ✅ | Stateless JWT verification token verification, console logs, and login validation. |
| Rate Limiting (Login) | ✅ | IP-based in-memory rate-limiter middleware protection on login and registration. |

---

### 2. User Profile & Notifications

| Feature | State | Details |
|---------|-------|---------|
| View / Edit Profile | ✅ | Name, roll number, department, class, section. Email and role are read-only. |
| Notification Bell + Badge | ✅ | **Real-time via Socket.IO** — notifications push instantly to the bell (no more 30s polling), shows unread count badge, mark individual as read. |
| Mark All Notifications Read | ✅ | Added read-all endpoint and button in the notifications menu. |
| Profile Picture Upload | ❌ | Avatar is a static icon. No upload mechanism. |
| Notification Pagination | ✅ | Paginated notification fetch and "Load More" controls added. |
| Email Notification Preference | ✅ | Per-user `emailNotificationsEnabled` toggle on the Profile page controlling whether critical notifications are also emailed. |

---

### 3. Club / Department Management

| Feature | State | Details |
|---------|-------|---------|
| Create Club | ✅ | Admin/Faculty can create. Creator auto-added as LEADER. |
| List Clubs with Counts | ✅ | Shows member count, event count, leader info. |
| View Club Detail | ✅ | Members list with roles. |
| Add Members (by email) | ✅ | Role assignment (MEMBER, LEADER, CO_LEADER). Authorization checks on who can assign which role. |
| Edit Club (name/description) | ✅ | Implemented Edit details Dialog. |
| Delete Club | ✅ | Implemented Delete actions. |
| Remove Member from Club | ✅ | Implemented Remove Member action in the member directory modal. |
| Leave Club (self) | ✅ | Implemented voluntary leave option. |
| Search / Filter Clubs | ✅ | Integrated client-side search text filter. |

---

### 4. Event Lifecycle

| Feature | State | Details |
|---------|-------|---------|
| Create Event (with Poster) | ✅ | Title, description, date, duration, location, capacity, paid/free, base64 poster upload. |
| Event Status State Machine | ✅ | **9-state machine** with strict transition validation: DRAFT → PENDING_APPROVAL → APPROVED → ONGOING → COMPLETED → ATTENDANCE_VERIFIED → OD_GENERATED. Rejection loops back. |
| Submit for HOD Approval | ✅ | DRAFT → PENDING_APPROVAL transition. |
| HOD Approve / Reject (with Comments) | ✅ | Creates EventApproval record. Reject requires comments. |
| Start / Complete / Verify Events | ✅ | Full lifecycle buttons on Organizer Dashboard. |
| Add Co-Hosts (Faculty) | ✅ | Organizer can add faculty as co-hosts who share management privileges. |
| Delete Event (Admin only) | ✅ | Admin can delete from the Events list page. |
| Edit Existing Event | ✅ | Added EditEvent view and organizer edit button. |
| Individual Event Detail Page | ✅ | Created EventDetail view page component. |
| Event Search / Filters | ✅ | Added search, club, status, and fee filters. |
| Event Pagination | ✅ | Added pagination controls and server-side limit/page constraints. |

---

### 5. Registration & Payments

| Feature | State | Details |
|---------|-------|---------|
| Register for Event | ✅ | **Concurrency-safe** with row-level locking (`SELECT FOR UPDATE`). Prevents overselling. |
| Auto-Waitlist on Full Capacity | ✅ | Students are waitlisted when seats run out. |
| FIFO Waitlist Promotion | ✅ | Cancellation auto-promotes oldest waitlisted student with a notification. |
| Submit Payment Reference | ✅ | Student submits bank/UPI transaction reference string. |
| Organizer Verify / Reject Payment | ✅ | Organizer reviews references. PAID → ACTIVE, FAILED → seat released. |
| Cancel Registration | ✅ | Student can cancel. Seat released, waitlist promoted. |
| Auto-Expire Stale Registrations | ✅ | Background job every 5 min cancels PENDING registrations older than 15 min and releases seats. |
| View My Registrations + Status | ✅ | Cards with status chips (ACTIVE, PENDING, WAITLISTED, CANCELLED), attendance badge, action buttons. |
| Real Payment Gateway | ❌ | Payment is **fully simulated** — hardcoded UPI ID, fake bank details, "Simulate Reference" button. No Razorpay/Stripe integration. |
| Currency | ✅ | Converted display to ₹ globally. |

> [!NOTE]
> The payment dialog component is **duplicated** between [EventsList.tsx](file:///d:/Coding/campus-pulse/frontend/src/pages/EventsList.tsx) and [StudentRegistrations.tsx](file:///d:/Coding/campus-pulse/frontend/src/pages/student/StudentRegistrations.tsx). Should be extracted into a shared component.

---

### 6. QR Ticketing & Attendance

| Feature | State | Details |
|---------|-------|---------|
| Signed QR Code Generation | ✅ | HMAC-SHA256 signed tokens with event ID, registration ID, and timestamp. |
| QR Code Display + Copy Token | ✅ | Student can view QR in a dialog, copy raw token for testing. |
| Camera QR Scanner | ✅ | Uses `html5-qrcode` library. Clear success/error result cards. |
| Manual Token Entry (Dev) | ✅ | Text field for pasting tokens. Labeled as "Testing Bypass" — should be hidden in production. |
| Multi-Layer Scan Authorization | ✅ | Checks: valid signature → registration exists → event matches → status ACTIVE → event in scannable state → scanner is authorized volunteer/organizer/co-host/admin → no duplicate scan. |
| Assign Volunteers to Event | ✅ | Organizer adds by email. Multi-layer auth (organizer, co-host, coordinator, leader, admin). |
| Remove Volunteer | ✅ | Assign dialog lists current volunteers with remove action button. |
| Scan History / Count | ✅ | Scanner page displays count of scans in current session. |
| Undo / Revoke Attendance | ✅ | Organizer dashboard attendance list displays revoke action button. |

---

### 7. On-Duty (OD) Letter System

| Feature | State | Details |
|---------|-------|---------|
| Faculty Approves OD Generation | ✅ | HOD/Admin triggers batch generation for all attended students at an event. |
| Individual PDF Generation | ✅ | PDFKit-generated letter with branding, student info table, verification ID. |
| Consolidated PDF Download | ✅ | Multi-student PDF with table, page breaks, signature sections. Organizer downloads as blob. |
| List My OD Letters | ✅ | Added "Download" column in table trigger. |
| OD Regeneration / Retry | ✅ | Added individual and bulk regeneration endpoints and buttons. |
| OD Revocation | ✅ | Added individual revocation capability for HODs and Admins. |

---

### 8. Administration

| Feature | State | Details |
|---------|-------|---------|
| View All Users | ✅ | Table with name, email, roll number, department, role. |
| Change User Role | ✅ | Dropdown to assign any role (STUDENT, FACULTY, HOD, ADMIN). |
| View Audit Logs | ✅ | Added paginated audit logs list. |
| User Search / Filter | ✅ | Added search bar. |
| Delete User | ✅ | Added user deletion action button. |
| Create User (from Admin) | ✅ | Dedicated route and "Create User" dashboard form dialog. |
| System Stats Dashboard | ✅ | Added Stats Tab with registered, catalog, and registration numbers. |
| Pagination | ✅ | Added paginated navigation buttons for Users and Audit Logs tables. |

---

### 9. Testing

| Feature | State | Details |
|---------|-------|---------|
| Concurrency Test | ✅ | Integrated into standard Jest test suite. |
| Security Test (Token Theft) | ✅ | Integrated into standard Jest test suite. |
| Unit Tests | ✅ | Jest unit tests covering rate limit middleware and auth helper logic. |
| Integration / API Tests | ✅ | Jest integration test covering registration and login verification flows. |
| Test Framework Setup | ✅ | Fully configured with ts-jest, supertest, and package.json test runner scripts. |
| CI/CD Pipeline | ✅ | GitHub Actions workflow verifying DB migration, tests, and code builds. |

---

## Suggested New Features

### 🔴 High Priority (Core Gaps) — [ALL COMPLETED]

#### 1. Individual Event Detail Page — ✅ Completed
> **Why**: Users currently see truncated descriptions on cards. There's no way to view full event details, see who's organizing, check the poster at full size, or read comments.
>
> **Scope**: New route `/events/:id`, new page component, backend already has `GET /events/:id`.
>
> **Implementation**: Integrated and routed in `App.tsx` via `/events/:id`. Title links on event list cards route to full event details page.

#### 2. Password Change & Forgot Password — ✅ Completed
> **Why**: Users have zero recourse if they forget their password. This is a baseline auth expectation.
>
> **Scope**: New `PUT /auth/change-password` endpoint, new `POST /auth/forgot-password` + `POST /auth/reset-password` endpoints. Requires an email sending service (Nodemailer + SMTP or a service like SendGrid).
>
> **Implementation**: Registered PUT route for password changes, set up SMTP/Ethereal email sending utilizing Nodemailer, and integrated verification/reset email dispatching.

#### 3. Edit Event Page — ✅ Completed
> **Why**: The backend supports event editing (`PUT /events/:id`) but there's no frontend page. Organizers must delete and recreate events to fix a typo.
>
> **Scope**: New route `/events/:id/edit` (reuse CreateEvent form), pre-populated with existing data.
>
> **Implementation**: Created and routed in `App.tsx` via `/events/:id/edit`. Pre-populated with the target event's details.

#### 4. OD Letter Download Button (Student Page) — ✅ Completed
> **Why**: The Student ODs page says "Download authenticated PDF On-Duty credentials" but has **no download action**. Backend endpoint `GET /od/download/:verificationId` exists and works.
>
> **Scope**: Add a "Download" button column to the ODs table calling the existing API.
>
> **Implementation**: Added direct PDF download trigger via Blobs inside `StudentODs.tsx` matching the existing verified download endpoint.

#### 5. Pagination (Global) — ✅ Completed
> **Why**: Every list endpoint dumps all records at once. With a growing campus, this will kill performance — events, registrations, users, audit logs, notifications.
>
> **Scope**: Backend: Add `page` and `limit` query params to all list endpoints. Frontend: Add pagination controls (MUI `Pagination` or infinite scroll).
>
> **Implementation**: Paginated registries (`/registrations/me`, `/registrations/event/:eventId`) and OD credentials (`/od/me`) on the backend. Added clean paging controls to `StudentRegistrations.tsx` and `StudentODs.tsx` frontend views.

---

### 🟡 Medium Priority (Quality of Life) — [6-9 COMPLETED]

#### 6. Real-time Notifications (WebSocket / SSE) — ✅ Completed
> **Why**: Polling every 30 seconds is wasteful and introduces latency. Attendance scans, payment approvals, and waitlist promotions should be instant.
>
> **Scope**: Socket.io or native WebSocket server. Emit events on registration, payment, scan, OD approval.
>
> **Implementation**: Added a JWT-authenticated Socket.IO server (`backend/src/realtime/socket.ts`) with per-user (`user:<id>`) and per-event (`event:<id>`) rooms. A new `notifyUser()` helper (`backend/src/utils/notify.ts`) centralizes notification creation, pushing it over the socket instantly and optionally emailing it (fire-and-forget so it never blocks request handling). Wired into registration confirmation, payment approval/rejection, waitlist promotion, OD-letter-ready, and attendance scans. The frontend bell now listens for `notification:new` instead of polling, and the Organizer Dashboard's Registrants/Attendance dialogs join the event's room to reflect scans and registration changes live.

#### 7. Event Analytics Dashboard (Organizer) — ✅ Completed
> **Why**: Organizers manage events blindly. They need registration trends over time, daily sign-up rates, check-in rate graphs, revenue breakdowns.
>
> **Scope**: New backend aggregate endpoints, Chart.js or Recharts on frontend.
>
> **Implementation**: Added `GET /events/:id/analytics` (registration trend by day with cumulative totals, status breakdown, check-in rate, revenue collected/pending). Added an "Analytics" action on each event in the Organizer Dashboard opening a dialog with `recharts` line and bar charts.

#### 8. Advanced Event Filtering & Search — ✅ Completed
> **Why**: Text-only search is limiting. Users should filter by date range, club/department, free/paid, status, and available seats.
>
> **Scope**: Backend: Prisma `where` clause builder. Frontend: Filter sidebar or chip selectors.
>
> **Implementation**: `GET /events` now accepts `dateFrom`, `dateTo`, and `availableOnly` query params in addition to the existing search/club/status/fee filters. `EventsList.tsx` gained date-range fields and an "Available seats only" checkbox.

#### 9. Email Notifications — ✅ Completed
> **Why**: In-app notifications are only visible when users are logged in. Critical events (registration confirmation, payment approval, waitlist promotion, OD ready) should also go to email.
>
> **Scope**: Nodemailer integration, HTML email templates, configurable per-user preferences.
>
> **Implementation**: Reused the existing Nodemailer utility via `notifyUser()`. Added an `emailNotificationsEnabled` column on `User` (migrated) with a toggle on the Profile page. Emails (respecting the preference) now fire for registration confirmation, payment approval/rejection, waitlist promotion, and OD-letter-ready.

#### 10. Admin System Stats Dashboard
> **Why**: Admin panel is just a user list and raw audit log. Admins need a bird's-eye view: total users by role, events by status, registration trends, revenue totals.
>
> **Scope**: New `GET /admin/stats` endpoint with aggregation queries. Dashboard cards + simple charts.

#### 11. Remove / Edit Club Members
> **Why**: Once a member is added to a club, they're stuck forever. No edit role, no remove.
>
> **Scope**: `PUT /clubs/:id/members/:memberId` (role change), `DELETE /clubs/:id/members/:memberId` (remove).

---

### 🟢 Low Priority (Nice-to-Have)

#### 12. Dark Mode: Respect OS `prefers-color-scheme`
> On first visit, default to the user's OS preference instead of always starting in light mode.

#### 13. Export Data (CSV/Excel)
> Organizers should be able to export registrations, attendance, and payment data as CSV/Excel for offline record-keeping.

#### 14. Event Comments / Announcements
> Allow organizers to post updates/announcements on an event page. Students get notified.

#### 15. Multi-Language Support (i18n)
> For campuses with regional language requirements.

#### 16. Calendar View for Events
> Visual monthly/weekly calendar alongside the card grid.

#### 17. Bulk User Import (Admin)
> Admin uploads a CSV of students (name, email, roll number, department) to create accounts in batch.

#### 18. Student Certificate Templates
> Customizable certificate templates beyond the standard OD letter (participation certs, winner certs, etc.).

---

## Optimizations Needed

### 🔴 Critical (Performance / Security)

#### 1. Wire Up Remaining Rate Limiters — Partially Completed
`authRateLimiter` is applied to `POST /auth/register`, `/login`, `/google-login`, `/logout`, and `/refresh`. However, `scanRateLimiter`, `writeRateLimiter`, and `generalRateLimiter` are already defined in `rateLimit.middleware.ts` but not wired into any router:
- `POST /attendance/scan` — no `scanRateLimiter` applied, still open to DoS via rapid scans
- All other `POST`/`PUT` endpoints — no `writeRateLimiter`/`generalRateLimiter` applied, still open to general abuse

> **Recommendation**: Apply the existing `scanRateLimiter` to the attendance scan route and `writeRateLimiter`/`generalRateLimiter` to the remaining write/read routes.

#### 2. Event List Query Over-Fetching
`GET /events` includes full `registrations` array with nested `payment` and `attendance` for every event. For a list view, this is massively wasteful.

> **Fix**: Use `_count` for list endpoints. Only include full registration data on the detail endpoint `GET /events/:id`.

---

### 🟡 Important (Code Quality / Maintainability)

#### 4. Decompose OrganizerDashboard.tsx (743 Lines)
This single component handles stats cards, event table, and 4 different dialogs (registrants, attendance, volunteers, co-hosts). It should be broken into:
- `OrganizerStats.tsx`
- `OrganizerEventsTable.tsx`
- `RegistrantsDialog.tsx`
- `AttendanceDialog.tsx`
- `VolunteerDialog.tsx`
- `CoHostDialog.tsx`

#### 5. Extract Shared Payment Dialog
The payment dialog (GPay/Bank Transfer simulation) is copy-pasted between `EventsList.tsx` and `StudentRegistrations.tsx`. Extract to `components/common/PaymentDialog.tsx`.

#### 6. Replace `any` Types
Multiple files use `any[]` for state variables (`registrants`, `members`, `volunteers`, `attendance`). Define proper TypeScript interfaces for all API response shapes.

#### 7. Replace `window.confirm()` / `window.alert()` with MUI Dialogs
Inconsistent with the rest of the UI. Found in:
- Event deletion confirmation (EventsList)
- Registration cancel confirmation (StudentRegistrations)
- Payment verification errors (OrganizerDashboard)
- OD approval errors (FacultyDashboard)

#### 8. Consistent Error Response Pattern
Backend mixes `next(error)` (global handler) with inline `res.status().json()`. Some 404s return 400. Introduce a custom `AppError` class hierarchy with proper status codes.

---

### 🟢 Minor (Polish)

#### 9. Add Request Timeout to Axios
The Axios instance in `api.ts` has no timeout configured — requests can hang indefinitely on a slow/dead server.
```ts
const api = axios.create({ baseURL: '/api', timeout: 15000 });
```

#### 10. Load SF Pro Font or Remove References
The theme references `"SF Pro Display"` and `"SF Pro Text"` but neither font is loaded via `@font-face` or a CDN. The system falls back to Inter/system fonts silently. Either load the fonts or update the theme to reference only the loaded fallback (Inter).

#### 11. Add `aria-label` to Notification Bell
The notification IconButton in the header lacks an accessibility label for screen readers.

#### 12. Waitlist Promotion Gap in Background Job — ✅ Resolved
`expirePendingRegistrations()` cancels stale PENDING registrations, releases seats, **and** promotes the oldest waitlisted student into the freed slot (with a real-time + email notification), matching the manual cancellation path.
