-- 002_tables.sql (fixed)
-- Fix: bookings_no_overlap now uses starts_at / ends_at (the real column names)
-- Requires the enum types created in 001 (user_role, verified_status, requirement_type,
-- credential_status, booking_status, condition_phase, incident_type, incident_severity,
-- incident_status, notification_type, audit_action).

create extension if not exists btree_gist;

-- Organizations
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'college', -- college, makerspace, lab, startup
  domain text, -- email domain for auto-verification
  address text,
  website text,
  logo_url text,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  role user_role not null default 'user',
  org_id uuid references organizations(id),
  verified_status verified_status not null default 'pending',
  bio text,
  phone text,
  -- fair-use tracking
  active_bookings_count integer not null default 0,
  noshow_count integer not null default 0,
  cooldown_until timestamptz,
  -- metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resources
create table resources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id),
  owner_id uuid not null references profiles(id),
  name text not null,
  description text not null,
  category text not null, -- equipment, space, kit, workstation
  location text not null,
  image_url text,
  is_active boolean not null default true,
  -- booking rules
  weekly_hour_cap integer not null default 6,
  max_booking_duration_hours integer not null default 8,
  min_notice_hours integer not null default 24,
  advance_booking_days integer not null default 30,
  requires_approval boolean not null default true,
  -- metadata
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resource requirements (what a user must have to book)
create table resource_requirements (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  type requirement_type not null,
  name text not null,
  description text not null,
  is_mandatory boolean not null default true,
  created_at timestamptz default now()
);

-- Availability slots (when a resource is available)
create table availability_slots (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_recurring boolean default false,
  recurrence_rule text, -- RRULE string
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint valid_slot check (ends_at > starts_at)
);

-- User credentials (documents uploaded to meet requirements)
create table user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  requirement_id uuid references resource_requirements(id),
  name text not null,
  description text,
  file_url text, -- signed storage URL path
  file_name text,
  status credential_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  expiry_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  user_id uuid not null references profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status booking_status not null default 'requested',
  purpose text not null,
  purpose_category text not null default 'general', -- coursework, project, research, commercial, general
  -- decision info
  decision_reason text,
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  -- waitlist
  waitlist_position integer,
  -- priority scoring
  priority_score integer not null default 0,
  is_first_time_user boolean not null default false,
  -- cancellation
  cancelled_at timestamptz,
  cancelled_by uuid references profiles(id),
  cancellation_reason text,
  -- timestamps
  checked_in_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_booking check (ends_at > starts_at)
);

-- Prevent double-booking: one approved/checked_in booking per resource per time range
alter table bookings
  add constraint bookings_no_overlap
  exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('approved', 'checked_in'));

-- Waitlist entries
create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id),
  user_id uuid not null references profiles(id),
  booking_id uuid references bookings(id),
  desired_starts_at timestamptz not null,
  desired_ends_at timestamptz not null,
  position integer not null,
  promoted_at timestamptz,
  promoted_booking_id uuid references bookings(id),
  created_at timestamptz default now()
);

-- Condition reports (before/after check-in/return)
create table condition_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  phase condition_phase not null,
  reported_by uuid not null references profiles(id),
  notes text not null,
  photo_urls text[] default '{}',
  created_at timestamptz default now()
);

-- Incidents
create table incidents (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  resource_id uuid not null references resources(id),
  reported_by uuid not null references profiles(id),
  type incident_type not null,
  severity incident_severity not null default 'medium',
  status incident_status not null default 'open',
  title text not null,
  description text not null,
  resolution_notes text,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  -- AI draft (never auto-applied)
  ai_summary_draft text,
  ai_summary_reviewed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  entity_type text, -- booking, incident, credential, etc.
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

-- Audit log (append-only: no UPDATE/DELETE allowed)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  actor_email text,
  action audit_action not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}',
  ip_address inet,
  created_at timestamptz default now()
);

-- Usage stats (per user per resource per week)
create table usage_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  resource_id uuid not null references resources(id),
  week_start date not null,
  hours_used numeric not null default 0,
  booking_count integer not null default 0,
  updated_at timestamptz default now(),
  unique(user_id, resource_id, week_start)
);
