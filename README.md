# LabShare — Trusted Resource-Sharing Platform

> **Hackathon Project — Code Hack India**
> A platform that connects engineering colleges, labs and makerspaces with students and startups who need access to underused equipment, facilities and workspaces.

---

## Problem Statement

Colleges and labs own expensive, underused equipment (3D printers, laser cutters, GPU workstations, seminar rooms). Nearby students and startups cannot afford them. A normal booking calendar is not enough — sharing institutional property needs **eligibility checks, approvals, check-in/check-out, condition records, damage reporting, fair allocation, and an auditable history**. Owners keep control; users must always be told *why* a request was approved, rejected or waitlisted.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes (server-side only) |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth |
| Storage | Supabase Storage (private buckets + signed URLs) |
| Realtime | Supabase Realtime (notifications) |
| Forms | React Hook Form + Zod |
| State | TanStack Query |
| Calendar | react-big-calendar |
| QR | qrcode.react + html5-qrcode |
| Charts | Recharts |
| Email | Resend (optional, graceful fallback) |
| AI | Anthropic Claude API (optional, server-side only, never auto-decides) |
| Toasts | sonner |
| Dates | date-fns |

---

## Roles

| Role | Capabilities |
|---|---|
| **user** | Browse resources, check eligibility, upload credentials, request bookings, check in/out, report damage, view own history |
| **owner** | List resources, set rules/requirements, approve/reject/waitlist requests (with mandatory reason), view usage |
| **manager** | Delegated reviewer — same review powers as owner, handles check-in/return, logs incidents |
| **admin** | Verify owners/users, manage all roles, view global audit log, run overdue checks, resolve disputes |

Enforced via: `role` column in `profiles` table + Postgres RLS policies + Next.js middleware route guards.

---

## Fairness & Allocation Rules

- **6-hour weekly cap** per user per resource
- **Max 2 active bookings** per user at any time
- **FIFO waitlist** with visible priority score
- **Priority score** = coursework/research bookings rank higher than commercial
- **First-time user bonus** — first booking gets a boost
- **Waitlist auto-promotion** — cancellation automatically promotes the next waitlisted user
- **All reasons visible** — every approve/reject/waitlist decision requires a mandatory reason shown to the user

---

## Setup Guide

### 1. Prerequisites
- Node.js 18+ 
- A Supabase project (free tier works)

### 2. Clone and Install
```bash
git clone <repo>
cd LabShare
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Optional (app works without these):
```
RESEND_API_KEY=re_...          # For email notifications
ANTHROPIC_API_KEY=sk-ant-...   # For AI incident summaries and smart match
```

### 4. Database Setup

In your Supabase project's SQL editor, run these migration files **in order**:

1. `supabase/migrations/001_extensions_and_types.sql`
2. `supabase/migrations/002_tables.sql`
3. `supabase/migrations/003_rls.sql`
4. `supabase/migrations/004_functions.sql`
5. `supabase/migrations/005_triggers.sql`

Then run the seed data:
```
supabase/seed.sql
```

### 5. Storage Buckets

In Supabase Dashboard → Storage, create two **private** buckets:
- `credentials` — for user credential documents
- `condition-photos` — for check-in/return condition photos

### 6. Run Locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials (Seed Data)

All passwords: **`Password123!`**

| Role | Email |
|---|---|
| Admin | `admin@apex.edu` |
| Owner | `owner1@apex.edu` |
| Owner 2 | `owner2@apex.edu` |
| Manager | `manager@apex.edu` |
| User (Alice) | `alice@apex.edu` |
| User (Bob) | `bob@apex.edu` |
| User (Carol) | `carol@apex.edu` |
| User (Dave) | `dave@apex.edu` |
| Startup | `startup@nexalab.io` |

**Organization:** Apex Engineering College  
**Resources seeded:** 3D Printer, Laser Cutter, Oscilloscope Kit, DSLR Camera Kit, Seminar Room A, GPU Workstation

---

## Judge Walkthrough — Definition of Done

Follow this journey to see all key features in one pass:

### Journey 1: Full Booking Lifecycle

1. **Browse as a user** — Log in as `alice@apex.edu`. Visit `/resources` to see the catalog with search/filter.

2. **Check eligibility** — Click on "Laser Cutter". The eligibility checklist shows which requirements Alice meets and which are pending. The **priority score** and **fair-use caps** are shown.

3. **Submit a booking** — Fill in the booking form (purpose, dates). The system checks the 6-hour weekly cap, max active bookings, and EXCLUDE double-booking constraint.

4. **See it in the queue** — Log in as `owner1@apex.edu`. Go to `/owner/requests`. See Alice's request with her priority score, user history, and resource conflict view.

5. **Approve with reason** — Click Approve. A modal requires a mandatory reason (min 10 chars). Submit → Alice receives an in-app notification.

6. **Check in with QR** — Log in as `manager@apex.edu`. Go to `/checkin/<booking-id>`. Optionally scan Alice's QR code (shown on her booking detail page). Fill in the before-use condition report with notes and photo.

7. **Return with condition** — After use, go to `/checkin/<booking-id>/return`. The before condition is shown on the left. Fill in after condition on the right.

8. **Report damage** — On the return success screen, click "Report Damage". Fill in the incident form (type, severity, description). Submit.

9. **Resolve incident** — As `owner1@apex.edu`, go to `/incidents/<incident-id>`. Optionally generate an AI summary (labeled "AI-generated, review before use"). Fill in resolution notes. Resolve.

10. **View audit history** — On `/bookings/<booking-id>`, the full timeline shows every status change with actor, reason, and timestamp.

### Journey 2: Double-Booking Blocked

Submit two overlapping bookings for the same resource. The second will be rejected by the PostgreSQL EXCLUDE constraint (`tstzrange` GiST index) — the error message explains why.

### Journey 3: Weekly Cap → Waitlist

1. Have a user book 6+ hours on a resource in the same week.
2. A new booking attempt shows the weekly cap exceeded.
3. The request goes to the waitlist with a visible explanation and FIFO position.

### Journey 4: Cancellation Promotes Waitlisted User

1. Cancel an approved booking.
2. The `cancel_booking` server function automatically promotes the first waitlisted user.
3. The promoted user receives a notification.

---

## AI Features

All AI features are:
- **Optional** — app works fully without `ANTHROPIC_API_KEY`
- **Server-side only** — the API key never reaches the browser
- **Labeled** — all AI output is marked "AI-generated draft — review before use"
- **Non-autonomous** — AI never approves, rejects, or penalizes any booking

### Available AI Features
1. **Smart Match** (`/api/ai/match`) — Suggests best-fit resources for a described need
2. **Incident Summariser** (`/api/ai/incident-summary`) — Drafts a human-readable incident summary for documentation

---

## Architecture Notes

### Security
- **RLS on all tables** — users can only see/modify their own data; audit_log has UPDATE/DELETE revoked
- **Append-only audit_log** — written by server-side Postgres triggers and functions only
- **Private storage** — credentials and photos use signed URLs; never publicly accessible
- **Server-side booking transitions** — all status changes go through Postgres RPCs; client can never write booking status directly
- **Middleware route guards** — role-based page access enforced in Next.js middleware before React renders

### Database Constraints
- `tstzrange` GiST EXCLUDE index prevents double-booking at the database level
- All booking state transitions validated in Postgres functions — invalid transitions rejected

---

## Disclosure

This project was built with the assistance of the following tools and libraries:

- **Antigravity AI Coding Assistant** (Google DeepMind) — used for code generation, debugging, and implementation across the full stack
- **Anthropic Claude API** — optional AI features (incident summariser, smart match) — never used for autonomous decisions
- **shadcn/ui** — UI component library
- **TanStack Query** — server state management
- **react-big-calendar** — availability calendar view
- **qrcode.react + html5-qrcode** — QR code generation and scanning
- **Recharts** — usage charts
- **Resend** — transactional email (optional)
- **date-fns** — date formatting and manipulation
- **Zod + React Hook Form** — form validation
- **sonner** — toast notifications
- All seed data is **entirely fictional**. No real people, organizations, emails or credentials are used.

---

## Project Structure

```
LabShare/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── admin/           # Admin panel, users, audit log
│   ├── bookings/        # My bookings, booking detail
│   ├── checkin/         # Check-in and return flows
│   ├── credentials/     # Upload and review credentials
│   ├── incidents/       # Report and resolve incidents
│   ├── notifications/   # Real-time notification feed
│   ├── owner/           # Owner dashboard, request queue, resource management
│   ├── profile/         # User profile
│   ├── resources/       # Resource catalog and detail
│   ├── dashboard/       # Role-aware home dashboard
│   └── api/             # All API routes (server-side only)
├── components/
│   ├── booking/         # BookingActions, Timeline, QR, ConditionReport
│   ├── layout/          # AppShell, Sidebar, TopBar
│   ├── resources/       # ResourceCard, Catalog, Calendar, EligibilityChecklist
│   └── ui/              # shadcn/ui primitives
├── lib/
│   ├── supabase/        # Browser and server Supabase clients
│   └── utils.ts         # Shared utilities
├── supabase/
│   ├── migrations/      # SQL migrations 001-005
│   └── seed.sql         # Fictional demo data
└── types/
    └── database.ts      # TypeScript types for all tables
```
