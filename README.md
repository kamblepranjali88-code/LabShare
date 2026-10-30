# LabShare: Fair, Verified Sharing of Lab Equipment and Spaces

**Code Hack India | Problem statement: Unlock Underused Equipment and Spaces**

LabShare is a web platform that connects people who own laboratory equipment, facilities and workspaces with students, researchers and startups who need them. It is a **trust and fairness layer**, not just a booking calendar: credential checks, fair-use limits, priority scoring, a waitlist and an audit log decide and record who gets access.

| | |
|---|---|
| **Live app** | https://lab-share-pied.vercel.app |
| **Repository** | https://github.com/kamblepranjali88-code/LabShare |

## Team Elite

| Name | Role |
|---|---|
| Pranjali Kamble | Team Leader, Backend and Database, Deployment |
| Sejal Revanwar | Team Member, Frontend and UI Design |
| Shraddha Jadhav | Team Member, Testing and Documentation |

---

## The Problem

Colleges and labs own expensive equipment (cameras, 3D printers, laser cutters, GPU workstations, oscilloscopes, rooms) that sits idle for long periods. Students and small teams cannot afford it. Access today is arranged through personal contacts and chat messages, so it is slow, bookings clash, nobody keeps a record, and owners cannot check that a borrower is qualified.

## The Solution

Users discover resources, upload credentials, and request bookings. The platform checks the request against the resource rules and the user's eligibility, then approves it, sends it to the owner, or waitlists it. Every decision is stored and visible.

---

## How to Start the Application

### Option A: Use the live app (no setup, recommended for judges)

1. Open https://lab-share-pied.vercel.app
2. Go to the login page. The **Demo Credentials** box shows the demo password.
3. Follow the test journey in [Verify the Application](#verify-the-application).

### Option B: Run it locally

You need **Node.js 18+**, **Git**, and a **Supabase project** that has the LabShare schema. If you do not have one, use Option A.

#### 1. Clone the repository

```bash
git clone https://github.com/kamblepranjali88-code/LabShare.git
cd LabShare
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Set up environment variables

Copy the example file:

```bash
copy .env.example .env.local
```

(On macOS or Linux: `cp .env.example .env.local`.)

Open `.env.local` and fill in your own values:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> `.env.local` is not tracked by Git. Never commit it, and never put a service-role key in browser code.

#### 4. Create the storage bucket

In Supabase, go to **Storage** and create a **private** bucket named `credentials` (5 MB limit; PDF, JPG, PNG and WEBP only).

#### 5. Run the app

```bash
npm run dev
```

Open http://localhost:3000

If a different port appears, old dev servers are still running. On Windows, stop them and restart:

```powershell
taskkill /F /IM node.exe
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Verify the Application

### Test journey: full booking lifecycle (about 2 minutes)

| Step | Who | What to do | What you should see |
|---|---|---|---|
| 1 | Student (`alice@apex.edu`) | Open **Resources** and pick the **Canon EOS 90D DSLR Camera Kit** | Resource details and the booking form |
| 2 | Student | Request a **2-hour weekday booking**, at least 3 days ahead, between **8 AM and 8 PM IST** | Request saved as **pending review** |
| 3 | Owner (`owner1@apex.edu`) | Open **Request Queue** and expand the request | Requester name, active bookings, no-shows, purpose, verification status |
| 4 | Owner | **Approve** the request | Status changes to **Approved** with a decision reason |
| 5 | Student | Open **My Bookings** | Booking shows **Approved**, with its history |
| 6 | Student | Cancel a booking | Status becomes **Cancelled** and the active-booking count goes down |

### Auto-approval check

The **3D printer**, **oscilloscope kit** and **Seminar Room B** do not need approval. A valid request on any of them is approved straight away. The **camera kit**, **laser cutter** and **GPU workstation** always go to the owner.

### Rules you can try to break

- Weekdays, 8 AM to 8 PM IST only. Other times are refused as outside open hours.
- A user can hold at most **2 active bookings**.
- Each resource has a maximum booking length and a weekly hour cap per user.

New sign-ups stay **pending** and cannot book until an admin verifies them, so use the demo accounts to test.

---

## Demo Accounts

All demo users belong to **Apex Engineering College** and are verified. The password is in the **Demo Credentials** box on the login page.

| Account | Role |
|---|---|
| `alice@apex.edu`, `bob@apex.edu`, `carol@apex.edu`, `dave@apex.edu` | Student (user) |
| `owner1@apex.edu` | Owner: camera kit, oscilloscope kit |
| `owner2@apex.edu` | Owner: 3D printer, laser cutter, GPU workstation |
| `manager@apex.edu` | Manager |
| `startup@nexalab.io` | External user (no organisation) |

## Roles

| Role | What they can do |
|---|---|
| `user` | Browse resources, upload credentials, book and cancel own bookings |
| `owner` | Review and decide on requests for the resources they own |
| `manager` | Review requests and credentials within their own organisation |
| `admin` | Platform-wide access and user verification |

---

## Application Workflow

```
Resource Discovery
        |
        v
Eligibility Check (verified? credential? cooldown? booking cap?)
        |
        v
Booking Rule Validation (length, notice, advance window, weekly hours, open hours)
        |
        v
Priority Score + Decision
        |-- No approval needed --> Approved automatically
        |-- Approval needed -----> Owner Request Queue --> Approve / Reject / Waitlist
        v
Audit Log + Notifications
        |
        v
Check-in --> Return --> Incident Report (if needed)
```

## Fair-Use Rules

- Each resource has its own **weekly hour cap per user** (for example, 6 hours per week on the camera kit), a maximum booking length, a minimum notice period and an advance-booking window.
- A user can hold at most **2 active bookings** at a time.
- Users who are not verified, are in a cooldown, or are missing a required credential cannot book.
- Each request gets a **priority score**. Coursework and research requests score higher than other purposes, and first-time users are flagged.
- Requests that cannot be served can go on a **waitlist**.
- Every action is written to the **audit log**.

## Features and Status

Status shows only what the team has actually tested.

| Feature | Status |
|---|---|
| Sign-up, login and role-based access | Verified |
| Resource discovery (six seeded resources) | Verified |
| Booking request with purpose and time | Verified |
| Auto-approval for resources that need no approval | Verified |
| Owner Request Queue with approve action and requester details | Verified |
| Cancel booking (status, booking count and audit entry update) | Verified |
| Credential upload to a private bucket, with 5-minute signed links | Verified (reported working) |
| Audit log of booking actions | Verified |
| Deployment on Vercel, redeployed on every push to `main` | Verified |
| Booking-rule validation (length, notice, advance, weekly hours, open hours) | Implemented, testing in progress |
| Reject, waitlist, check-in, return | Implemented, testing in progress |
| Notifications and incident reporting | Implemented, testing in progress |
| Admin screen to approve new users | Not built yet |

---

## System Architecture

```
Browser (user / owner / manager / admin)
        |
        v
Next.js 14 app on Vercel (pages + API routes)  <---  GitHub (push to main = deploy)
        |
        v
Supabase
  - Auth        login and sessions
  - PostgreSQL  13 tables, row level security, SQL functions for booking rules
  - Storage     private "credentials" bucket
```

Booking decisions (submit, approve, reject, waitlist, cancel, check-in, return, incident reporting) run as database functions, so the rules are enforced in one place.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Styling | Tailwind CSS, lucide-react, sonner (toasts) |
| Backend and database | Supabase (PostgreSQL, Auth, Storage, row level security) |
| Hosting | Vercel |
| Version control | Git and GitHub |

## Database

13 tables in the `public` schema:

`audit_log`, `availability_slots`, `bookings`, `condition_reports`, `incidents`, `notifications`, `organizations`, `profiles`, `resource_requirements`, `resources`, `usage_stats`, `user_credentials`, `waitlist_entries`.

## Security

- Sign-in is handled by Supabase Auth. Passwords are never stored in the app.
- Row level security limits data by role on bookings and profiles (own data, owner or manager in the same organisation, and admin).
- A database trigger stops non-admins from changing their own role, verification status, organisation, booking counters or cooldown.
- New accounts are always created as role `user` with status `pending`, so nobody can sign up as an admin.
- Credential documents live in a **private** bucket. Upload paths are forced into the uploader's own folder, files are limited to 5 MB and to PDF, JPG, PNG or WEBP, and viewing uses a 5-minute signed link.
- The app uses only the Supabase project URL and the public anon key. No service-role key is configured in Vercel.

---

## Expected Outcome

A judge can sign in with a demo account, find a resource, request a booking, see an owner approve it, and read the full history, all on the live link. The platform shows that shared equipment can be opened up to more people **without losing control**: only verified, eligible users can book, limits keep access fair, and every decision leaves a record.

## Known Limitations

- Booking-rule refusals, reject, waitlist, check-in, return and notifications are implemented but still being tested end to end.
- Approval functions are being tightened so the acting user always comes from the signed-in session, and so approvals check that the actor owns the resource.
- There is no admin screen yet for approving new users. For now, verification is done directly in the database.
- Cancelling a booking does not yet send a notification.
- Some seeded resource photos do not match their resources.
- For the demo, email confirmation is turned off. It should be turned on for real users.

## Future Scope

- Calendar view of free and booked slots
- Email notifications
- Check-in and return with condition notes and photos
- Admin screen for user verification and usage reports for institutions
- Ratings and reviews
- Online payment for paid resources
- Mobile-friendly app

## AI Disclosure

AI tools were used during development: the Antigravity AI coding assistant (Google DeepMind) for code generation, debugging and implementation, and ChatGPT and Claude for understanding concepts, troubleshooting errors and improving code and documentation. The team reviewed and tested the results and remains responsible for the final implementation. All seed data is fictional.
