-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table resources enable row level security;
alter table resource_requirements enable row level security;
alter table availability_slots enable row level security;
alter table user_credentials enable row level security;
alter table bookings enable row level security;
alter table waitlist_entries enable row level security;
alter table condition_reports enable row level security;
alter table incidents enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table usage_stats enable row level security;

-- Helper: get current user role
create or replace function get_user_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: get current user org
create or replace function get_user_org()
returns uuid language sql security definer stable as $$
  select org_id from profiles where id = auth.uid()
$$;

-- Organizations: everyone can read, only admin can write
create policy "orgs_select" on organizations for select using (true);
create policy "orgs_insert" on organizations for insert with check (get_user_role() = 'admin');
create policy "orgs_update" on organizations for update using (get_user_role() = 'admin');

-- Profiles: users see their own; admins see all; owners/managers see their org
create policy "profiles_select_own" on profiles for select using (id = auth.uid());
create policy "profiles_select_admin" on profiles for select using (get_user_role() = 'admin');
create policy "profiles_select_owner_manager" on profiles for select
  using (get_user_role() in ('owner', 'manager') and org_id = get_user_org());
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on profiles for update using (id = auth.uid());
create policy "profiles_update_admin" on profiles for update using (get_user_role() = 'admin');

-- Resources: everyone can read active; owners manage their own
create policy "resources_select" on resources for select using (is_active = true or owner_id = auth.uid() or get_user_role() = 'admin');
create policy "resources_insert" on resources for insert with check (
  get_user_role() in ('owner', 'admin') and owner_id = auth.uid()
);
create policy "resources_update" on resources for update using (
  owner_id = auth.uid() or get_user_role() = 'admin'
);

-- Resource requirements: everyone can read
create policy "reqs_select" on resource_requirements for select using (true);
create policy "reqs_insert" on resource_requirements for insert with check (
  get_user_role() in ('owner', 'admin')
);
create policy "reqs_update" on resource_requirements for update using (
  get_user_role() in ('owner', 'admin')
);
create policy "reqs_delete" on resource_requirements for delete using (
  get_user_role() in ('owner', 'admin')
);

-- Availability slots: everyone can read
create policy "avail_select" on availability_slots for select using (true);
create policy "avail_insert" on availability_slots for insert with check (
  get_user_role() in ('owner', 'manager', 'admin')
);
create policy "avail_update" on availability_slots for update using (
  get_user_role() in ('owner', 'manager', 'admin')
);
create policy "avail_delete" on availability_slots for delete using (
  get_user_role() in ('owner', 'manager', 'admin')
);

-- User credentials: users see their own; managers/owners see all for their resources; admins see all
create policy "creds_select_own" on user_credentials for select using (user_id = auth.uid());
create policy "creds_select_admin" on user_credentials for select using (get_user_role() = 'admin');
create policy "creds_select_manager" on user_credentials for select using (
  get_user_role() in ('owner', 'manager')
);
create policy "creds_insert" on user_credentials for insert with check (user_id = auth.uid());
create policy "creds_update_own" on user_credentials for update using (user_id = auth.uid());
create policy "creds_update_reviewer" on user_credentials for update using (
  get_user_role() in ('owner', 'manager', 'admin')
);

-- Bookings: users see their own; owners/managers see their resources'; admins see all
create policy "bookings_select_own" on bookings for select using (user_id = auth.uid());
create policy "bookings_select_admin" on bookings for select using (get_user_role() = 'admin');
create policy "bookings_select_owner_manager" on bookings for select
  using (
    get_user_role() in ('owner', 'manager') and
    resource_id in (select id from resources where owner_id = auth.uid() or org_id = get_user_org())
  );
create policy "bookings_insert" on bookings for insert with check (user_id = auth.uid());
create policy "bookings_update_own" on bookings for update using (user_id = auth.uid());
create policy "bookings_update_owner_manager" on bookings for update using (
  get_user_role() in ('owner', 'manager', 'admin')
);

-- Waitlist entries
create policy "waitlist_select_own" on waitlist_entries for select using (user_id = auth.uid());
create policy "waitlist_select_admin" on waitlist_entries for select using (get_user_role() = 'admin');
create policy "waitlist_select_owner" on waitlist_entries for select using (get_user_role() in ('owner', 'manager'));
create policy "waitlist_insert" on waitlist_entries for insert with check (user_id = auth.uid() or get_user_role() in ('owner', 'manager', 'admin'));
create policy "waitlist_update" on waitlist_entries for update using (get_user_role() in ('owner', 'manager', 'admin'));

-- Condition reports
create policy "cond_select_own" on condition_reports for select
  using (booking_id in (select id from bookings where user_id = auth.uid()));
create policy "cond_select_owner" on condition_reports for select using (get_user_role() in ('owner', 'manager', 'admin'));
create policy "cond_insert" on condition_reports for insert with check (reported_by = auth.uid());

-- Incidents
create policy "incidents_select_own" on incidents for select
  using (reported_by = auth.uid() or booking_id in (select id from bookings where user_id = auth.uid()));
create policy "incidents_select_owner" on incidents for select using (get_user_role() in ('owner', 'manager', 'admin'));
create policy "incidents_insert" on incidents for insert with check (reported_by = auth.uid());
create policy "incidents_update" on incidents for update using (get_user_role() in ('owner', 'manager', 'admin'));

-- Notifications: users see their own
create policy "notif_select" on notifications for select using (user_id = auth.uid());
create policy "notif_update" on notifications for update using (user_id = auth.uid());
create policy "notif_insert" on notifications for insert with check (true); -- server inserts
create policy "notif_admin" on notifications for select using (get_user_role() = 'admin');

-- Audit log: users see entries related to them; admins see all
create policy "audit_select_own" on audit_log for select using (actor_id = auth.uid());
create policy "audit_select_admin" on audit_log for select using (get_user_role() = 'admin');
create policy "audit_select_owner" on audit_log for select using (get_user_role() in ('owner', 'manager'));
-- append-only: no UPDATE or DELETE
create policy "audit_insert" on audit_log for insert with check (true);
revoke update on audit_log from authenticated;
revoke delete on audit_log from authenticated;
revoke update on audit_log from anon;
revoke delete on audit_log from anon;

-- Usage stats
create policy "usage_select_own" on usage_stats for select using (user_id = auth.uid());
create policy "usage_select_admin" on usage_stats for select using (get_user_role() in ('owner', 'manager', 'admin'));
create policy "usage_upsert" on usage_stats for all using (true); -- managed server-side
