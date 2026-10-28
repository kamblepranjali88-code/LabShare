# LabShare – Implementation Plan
<!-- Resume from: Phase 2 – Missing pages (owner dashboard, checkin, incidents, credentials, admin, notifications) -->

## STATUS REPORT (audited 2026-10-28)

### DONE ✅
- Next.js 14 scaffold + TypeScript + Tailwind + shadcn/ui (22 components)
- `lib/supabase/client.ts` + `lib/supabase/server.ts`
- `lib/utils.ts`, `types/database.ts`, `middleware.ts`
- `app/layout.tsx`, `app/page.tsx` (landing)
- `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/dashboard/page.tsx`
- `app/resources/page.tsx` + `app/resources/[id]/page.tsx`
- `app/bookings/page.tsx` + `app/bookings/[id]/page.tsx`
- `components/layout/*` (AppShell, SidebarNav, TopBar)
- `components/resources/*` (ResourceCard, Catalog, Calendar, EligibilityChecklist, BookingForm)
- `components/booking/*` (BookingActions, Timeline, FairUseWidget, QrCodeDisplay, ConditionReportDisplay)
- `components/providers/query-provider.tsx`
- All API routes: bookings CRUD + eligibility + incidents + notifications + overdue + upload + AI
- SQL migrations 001–005 (types, tables, RLS, functions, triggers)
- `supabase/seed.sql`
- `.env.example`, `.env.local`

### PARTIAL / BROKEN 🔶
- Build: autoprefixer missing → now fixed; build in progress
- No git repo initialized yet
- `next.config.js` — webpack alias fix applied ✅
- Missing pages (stubs needed so build passes):
  - `app/checkin/[id]/page.tsx`
  - `app/checkin/[id]/return/page.tsx`
  - `app/incidents/[id]/page.tsx`
  - `app/incidents/new/page.tsx`  ← referenced in booking-actions
  - `app/credentials/page.tsx`
  - `app/notifications/page.tsx`
  - `app/owner/page.tsx`
  - `app/owner/requests/page.tsx`
  - `app/owner/resources/page.tsx`
  - `app/owner/resources/new/page.tsx`
  - `app/admin/page.tsx`
  - `app/admin/users/page.tsx`
  - `app/admin/audit/page.tsx`
  - `app/profile/page.tsx`
  - `app/403/page.tsx`

### NOT STARTED ❌
- Git repo + commits
- README (setup, seed creds, judge walkthrough, disclosure)
- Recharts usage charts (owner dashboard)
- Admin overdue manual trigger button
- Resend email integration
- Final accessibility pass

---

## PHASE CHECKLIST

### Phase 1 – Foundation
- [x] Next.js + TypeScript scaffold
- [x] Tailwind + shadcn/ui
- [x] Supabase clients (browser + server)
- [x] SQL migrations (001–005)
- [x] RLS policies
- [x] Audit log triggers + append-only
- [x] Seed script with fictional data
- [x] Auth pages (login, signup)
- [x] Role-aware middleware
- [x] .env.example
- [ ] Build compiles cleanly ← IN PROGRESS
- [ ] Git init + Phase 1 commit

### Phase 2 – Listings & Discovery
- [x] Resource catalog (search + filters)
- [x] Resource detail (calendar, requirements checklist, booking form)
- [ ] Owner: create/edit resource form (`/owner/resources/new`)
- [ ] Owner: manage resources list (`/owner/resources`)
- [x] Eligibility engine (server RPC + API route)
- [ ] Credentials upload + verification queue (`/credentials`)
- [ ] Build + test in browser
- [ ] Git commit Phase 2

### Phase 3 – Booking & Fairness
- [x] Booking request API (submit_booking_request RPC)
- [x] Booking state machine RPCs (approve/reject/waitlist/cancel)
- [x] Fair allocation (weekly cap, max 2, FIFO, priority score) — in DB functions
- [x] My bookings page
- [x] Booking detail + audit timeline
- [ ] Owner request review queue with conflicts view
- [ ] Approve/reject/waitlist UI with required reason modal
- [ ] FairUseWidget (exists, needs Supabase wired)
- [ ] Build + test in browser
- [ ] Git commit Phase 3

### Phase 4 – Check-in, Return, Incidents
- [x] QR code display (qrcode.react)
- [x] Check-in API route
- [x] Return API route
- [ ] Check-in page with condition form + photo upload
- [ ] Return page with before/after comparison
- [ ] QR scanner (html5-qrcode) on check-in page
- [x] Incident report API
- [x] Incident resolve API
- [ ] Incident detail page + resolve UI
- [ ] Incident new/report page
- [ ] Overdue detection (admin manual trigger button)
- [ ] Realtime notifications (bell)
- [ ] Notifications page
- [ ] Build + test in browser
- [ ] Git commit Phase 4

### Phase 5 – History, Admin, AI, Polish
- [x] Booking audit timeline component
- [ ] Admin panel (user verification, disputes)
- [ ] Admin: global audit log with filters
- [ ] Admin: overdue check button
- [ ] Recharts usage charts (owner dashboard)
- [x] AI: smart match + incident summariser (server-only, optional)
- [ ] Accessibility audit
- [ ] Loading/empty/error states on all pages
- [ ] Build + test in browser
- [ ] Git commit Phase 5

### Phase 6 – QA & Submission
- [ ] Full journey browser test (DoD)
- [ ] Double-booking blocked test
- [ ] Weekly cap → waitlist test
- [ ] Cancellation → promotion test
- [ ] RLS review
- [ ] Secrets check (no keys in repo)
- [ ] README (setup, seed, credentials, judge walkthrough, disclosure)
- [ ] Final git commit
