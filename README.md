# CampusFlow — Campus Event & On-Duty Management System

CampusFlow is a secure, premium campus event management application built to streamline department registrations, ticket payments, attendance tracking, and On-Duty (OD) authorization workflows. The project features a photography-first, Apple-inspired design system with modular role dashboards for students, volunteers, coordinators, and administrators.

---

## Technical Stack
- **Frontend**: React (TypeScript), Material UI (MUI), Vite, Axios, React Router.
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod validation.
- **Tools & Libraries**: PDF-Kit for batch OD generation, QRCode/SVG generator, Docker.

---

## Core Features
1. **Interactive Event Directory**: Users can filter, search, and register for department events (free or paid).
2. **Robust Ticketing & Payments**:
   - Students submit bank/UPI transaction references for paid events.
   - Organizers view submissions and approve/reject registrations manually (preventing self-verification bypasses).
   - Unpaid seats are automatically expired after 15 minutes to release blocked seats.
3. **FIFO Waitlist Queue**: Event cancellation automatically promotes waitlisted students in FIFO order, handles payments (if applicable), and issues notifications.
4. **QR Attendance Scanning**:
   - Students access signed QR codes from their profile.
   - Assigned gate volunteers scan codes to record attendance. Strict authorization checks ensure only assigned volunteers, hosts, or admins can scan.
5. **Batch On-Duty (OD) Generation**:
   - Faculty coordinators approve check-in logs.
   - Batch generator produces authenticated PDF OD certificates with verification keys, allowing HODs to easily retry any failed generation attempts.
6. **Platform Administration**: Admins can manage departments, adjust user roles (including Head of Department), and monitor system-wide audits.

---

## Design System (Apple-inspired)
- **Palette**: Signature Apple Action Blue (`#0066cc`) for interactive elements, daylight off-white parchment (`#f5f5f7`) canvases, and pure white (`#ffffff`) surfaces.
- **Responsive Dark Mode**: PERSISTED light/dark theme settings in `localStorage` toggled via the global header.
- **Clean Radii & Typography**: Pill capsules (`9999px`) on buttons and chips, rounded corners (`18px`) on cards/dialogs, and `11px` on text inputs. Styled with `"SF Pro Display"` headings and `"SF Pro Text"` body copies.
- **Simplification**: Zero element drop-shadows (reserved exclusively for product/event photography) and clean border styling.

---

## Getting Started

### Database Configuration
Ensure a PostgreSQL database is running. Update `backend/.env` with your connection string:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/campusflow_db?schema=public"
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ALLOWED_ORIGINS=http://localhost:5173
DISABLE_AUTO_OD_GENERATION=false
UPLOAD_DIR=uploads
```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run migrations and database seed:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

---

## Security Controls Implemented (In Fix Pass)
- **Lockdown Role Escalations**: Registration role is restricted to `Role.STUDENT` during creation to prevent administrative escalations.
- **Zod Sanitization**: Express validation middleware mutates original request objects with parsed schema output.
- **CORS Allowed Origins**: Strict CORS validation checking incoming request origins against an allowed whitelist.
- **Production Guard**: Boot verification requiring configuration of secret keys in production environment.
- **Scanner Restrictions**: Verification of gate scan credentials against assigned active volunteers, event hosts, co-hosts, club coordinators, department heads (HODs), and administrators.
