-- Enable required extensions
create extension if not exists btree_gist;
create extension if not exists pg_cron;

-- Enum types
create type user_role as enum ('user', 'owner', 'manager', 'admin');
create type verified_status as enum ('pending', 'verified', 'rejected');
create type requirement_type as enum ('training', 'membership', 'document', 'approval');
create type credential_status as enum ('pending', 'verified', 'rejected');
create type booking_status as enum (
  'requested', 'eligibility_check', 'pending_review',
  'approved', 'rejected', 'waitlisted',
  'checked_in', 'returned', 'closed', 'cancelled', 'incident'
);
create type incident_type as enum ('damage', 'delay', 'misuse');
create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type incident_status as enum ('open', 'under_review', 'resolved');
create type condition_phase as enum ('before', 'after');
create type notification_type as enum (
  'booking_approved', 'booking_rejected', 'booking_waitlisted',
  'booking_cancelled', 'waitlist_promoted', 'booking_reminder',
  'overdue_alert', 'incident_reported', 'incident_resolved',
  'credential_verified', 'credential_rejected', 'system'
);
create type audit_action as enum (
  'booking_requested', 'eligibility_checked', 'booking_approved',
  'booking_rejected', 'booking_waitlisted', 'booking_cancelled',
  'booking_checked_in', 'booking_returned', 'booking_closed',
  'booking_extended', 'incident_reported', 'incident_resolved',
  'waitlist_promoted', 'credential_submitted', 'credential_verified',
  'credential_rejected', 'noshow_proposed', 'noshow_confirmed',
  'resource_created', 'resource_updated', 'user_verified'
);
