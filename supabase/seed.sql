begin;

-- ============================================================
-- LabShare Seed Data - Apex Engineering College
-- DRY RUN: ends with rollback. Change the last line to commit; once it passes.
-- ============================================================

-- 1. ORGANIZATION
insert into organizations (id, name, type, domain, address, website, verified)
values (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Apex Engineering College',
  'college',
  'apex.edu',
  '42 Innovation Drive, Tech City, TC 10001',
  'https://apex.edu',
  true
);

-- 2. AUTH USERS
-- The on_auth_user_created trigger creates a pending 'user' profile for each;
-- the profiles upsert in section 3 then sets the real role/org/status.
-- (role in the metadata below is ignored by handle_new_user.)
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  v.id::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated',
  v.email, crypt('MyDemo#2026x', gen_salt('bf')),
  now(), now(), now(),
  jsonb_build_object('full_name', v.full_name),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  false, '', '', '', ''
from (values
  ('aaaaaaaa-1111-0000-0000-000000000001', 'admin@apex.edu',      'System Admin'),
  ('aaaaaaaa-1111-0000-0000-000000000002', 'owner1@apex.edu',     'Dr. Rajan Mehta'),
  ('aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',     'Prof. Sunita Rao'),
  ('aaaaaaaa-1111-0000-0000-000000000004', 'manager@apex.edu',    'Karan Verma'),
  ('aaaaaaaa-1111-0000-0000-000000000005', 'alice@apex.edu',      'Alice Sharma'),
  ('aaaaaaaa-1111-0000-0000-000000000006', 'bob@apex.edu',        'Bob Nair'),
  ('aaaaaaaa-1111-0000-0000-000000000007', 'carol@apex.edu',      'Carol Patel'),
  ('aaaaaaaa-1111-0000-0000-000000000008', 'dave@apex.edu',       'Dave Kulkarni'),
  ('aaaaaaaa-1111-0000-0000-000000000009', 'startup@nexalab.io',  'Nexa Lab')
) as v(id, email, full_name);

-- 2b. LOGIN IDENTITIES (needed for email+password sign-in)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@apex.edu' or u.email = 'startup@nexalab.io';

-- 3. PROFILES
insert into profiles (id, email, full_name, role, org_id, verified_status, bio, phone, active_bookings_count)
values
  ('aaaaaaaa-1111-0000-0000-000000000001',
   'admin@apex.edu', 'System Admin', 'admin',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Platform administrator for Apex Engineering College LabShare.', '+91-9000000001', 0),

  ('aaaaaaaa-1111-0000-0000-000000000002',
   'owner1@apex.edu', 'Dr. Rajan Mehta', 'owner',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Head of Electronics & Instrumentation Lab. Manages oscilloscopes and testing kits.', '+91-9000000002', 0),

  ('aaaaaaaa-1111-0000-0000-000000000003',
   'owner2@apex.edu', 'Prof. Sunita Rao', 'owner',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Head of Digital Fabrication Lab. Manages 3D printers, laser cutters, and GPU workstations.', '+91-9000000003', 0),

  ('aaaaaaaa-1111-0000-0000-000000000004',
   'manager@apex.edu', 'Karan Verma', 'manager',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Lab manager responsible for bookings coordination and resource availability.', '+91-9000000004', 0),

  ('aaaaaaaa-1111-0000-0000-000000000005',
   'alice@apex.edu', 'Alice Sharma', 'user',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Final-year ECE student working on her capstone project.', '+91-9000000005', 1),

  ('aaaaaaaa-1111-0000-0000-000000000006',
   'bob@apex.edu', 'Bob Nair', 'user',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Third-year CS student interested in embedded systems.', '+91-9000000006', 0),

  ('aaaaaaaa-1111-0000-0000-000000000007',
   'carol@apex.edu', 'Carol Patel', 'user',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'Second-year ME student working on additive manufacturing research.', '+91-9000000007', 0),

  ('aaaaaaaa-1111-0000-0000-000000000008',
   'dave@apex.edu', 'Dave Kulkarni', 'user',
   'aaaaaaaa-0000-0000-0000-000000000001', 'verified',
   'First-year student exploring the lab facilities.', '+91-9000000008', 0),

  ('aaaaaaaa-1111-0000-0000-000000000009',
   'startup@nexalab.io', 'Nexa Lab', 'user',
   null, 'verified',
   'External startup with access to GPU workstation for AI model training.', '+91-9000000009', 0)
on conflict (id) do update set
  role = excluded.role,
  org_id = excluded.org_id,
  verified_status = excluded.verified_status,
  bio = excluded.bio,
  phone = excluded.phone,
  active_bookings_count = excluded.active_bookings_count;

-- 4. RESOURCES
insert into resources (
  id, org_id, owner_id, name, description, category, location,
  image_url, is_active, weekly_hour_cap, max_booking_duration_hours,
  min_notice_hours, advance_booking_days, requires_approval, tags
) values
(
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000003',
  'Creality Ender 5 Plus 3D Printer',
  'Large-format FDM 3D printer capable of printing objects up to 350×350×400mm. '
  'Supports PLA, PETG, TPU, and ABS filaments. Ideal for prototyping and product design.',
  'equipment',
  'Digital Fab Lab, Room 204, Block C',
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800',
  true, 8, 6, 12, 14, false,
  array['3d-printing', 'prototyping', 'fabrication', 'fdm']
),
(
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000003',
  'Epilog Fusion M2 Laser Cutter',
  '75W CO₂ laser cutter/engraver with a 32"×20" work area. Cuts wood, acrylic, leather, '
  'fabric, and anodised aluminium. Requires mandatory safety training before first use.',
  'equipment',
  'Digital Fab Lab, Room 204, Block C',
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800',
  true, 6, 4, 24, 21, true,
  array['laser', 'cutting', 'engraving', 'fabrication', 'safety-required']
),
(
  'bbbbbbbb-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000002',
  'Tektronix TBS2104 Oscilloscope Kit',
  '100 MHz 4-channel digital oscilloscope with a complete bench kit including function '
  'generator, DMM, and power supply. Perfect for electronics lab sessions and debugging.',
  'kit',
  'Electronics Lab, Room 112, Block A',
  'https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=800',
  true, 6, 4, 4, 30, false,
  array['oscilloscope', 'electronics', 'instrumentation', 'kit']
),
(
  'bbbbbbbb-0000-0000-0000-000000000004',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000002',
  'Canon EOS 90D DSLR Camera Kit',
  'Full camera kit with Canon EOS 90D body, 18-55mm kit lens, 50mm prime lens, '
  'tripod, lighting kit, and carry bag. Suitable for documentation, events, and academic projects.',
  'kit',
  'Media Resource Centre, Room 015, Block B',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
  true, 6, 8, 24, 30, true,
  array['camera', 'photography', 'dslr', 'media', 'kit']
),
(
  'bbbbbbbb-0000-0000-0000-000000000005',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000004',
  'Seminar Room B (30-seat)',
  '30-seat air-conditioned seminar room with projector, whiteboard, video-conferencing '
  'system, and surround audio. Ideal for presentations, workshops, and group study.',
  'space',
  'Academic Block, Room 301, Block D',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800',
  true, 8, 4, 2, 30, false,
  array['seminar', 'room', 'presentation', 'meeting', 'space']
),
(
  'bbbbbbbb-0000-0000-0000-000000000006',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000003',
  'NVIDIA A100 GPU Workstation',
  'High-performance AI/ML workstation with dual NVIDIA A100 80GB GPUs, 256GB RAM, '
  '4TB NVMe SSD, and Ubuntu 22.04. Pre-configured with CUDA, cuDNN, PyTorch, and TensorFlow. '
  'Requires explicit owner approval and proof of active research project.',
  'workstation',
  'HPC Lab, Room 008, Basement, Block C',
  'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800',
  true, 12, 8, 48, 14, true,
  array['gpu', 'ai', 'ml', 'deep-learning', 'hpc', 'workstation']
);

-- 5. RESOURCE REQUIREMENTS
insert into resource_requirements (id, resource_id, type, name, description, is_mandatory) values
(
  'cccccccc-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'training',
  'Laser Cutter Safety Training',
  'Complete the in-person laser cutter safety induction delivered by the Fab Lab team. '
  'Upload your signed completion certificate. Valid for 1 year.',
  true
),
(
  'cccccccc-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'document',
  'Lab Membership Card',
  'Upload a scan of your active Apex Engineering College Lab Membership Card.',
  true
),
(
  'cccccccc-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000006',
  'approval',
  'Owner Pre-Approval',
  'Contact Prof. Sunita Rao directly to obtain written pre-approval before booking. '
  'Attach the approval email as a PDF.',
  true
),
(
  'cccccccc-0000-0000-0000-000000000004',
  'bbbbbbbb-0000-0000-0000-000000000006',
  'document',
  'Active Research Project Proof',
  'Upload a one-page project brief or your faculty advisor''s confirmation letter '
  'confirming your active research project.',
  true
),
(
  'cccccccc-0000-0000-0000-000000000005',
  'bbbbbbbb-0000-0000-0000-000000000004',
  'membership',
  'Media Club Membership (Recommended)',
  'Members of the Apex Media Club receive priority booking. Upload your membership card if applicable.',
  false
);

-- 6. USER CREDENTIALS
insert into user_credentials (
  id, user_id, requirement_id, name, description,
  file_url, file_name, status, reviewed_by, reviewed_at, review_notes
) values
(
  'dddddddd-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'cccccccc-0000-0000-0000-000000000001',
  'Laser Safety Training Certificate',
  'Completed induction session on 2026-09-10.',
  'credentials/alice/laser_safety_cert.pdf', 'laser_safety_cert.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '30 days',
  'Certificate verified. Induction completed with full marks.'
),
(
  'dddddddd-0000-0000-0000-000000000002',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'cccccccc-0000-0000-0000-000000000002',
  'Lab Membership Card',
  'Active membership for AY 2026-27.',
  'credentials/alice/lab_membership.pdf', 'lab_membership.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '30 days',
  'Membership valid through May 2027.'
),
(
  'dddddddd-0000-0000-0000-000000000003',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'cccccccc-0000-0000-0000-000000000001',
  'Laser Safety Training Certificate',
  'Completed induction on 2026-08-15.',
  'credentials/bob/laser_safety_cert.pdf', 'laser_safety_cert.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '60 days',
  'Approved.'
),
(
  'dddddddd-0000-0000-0000-000000000004',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'cccccccc-0000-0000-0000-000000000002',
  'Lab Membership Card',
  'Active membership.',
  'credentials/bob/lab_membership.pdf', 'lab_membership.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '60 days',
  'Valid.'
),
(
  'dddddddd-0000-0000-0000-000000000005',
  'aaaaaaaa-1111-0000-0000-000000000009',
  'cccccccc-0000-0000-0000-000000000003',
  'GPU Workstation Pre-Approval – NexaLab',
  'Email approval from Prof. Sunita Rao for NexaLab AI training run.',
  'credentials/startup/gpu_preapproval.pdf', 'gpu_preapproval.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '10 days',
  'Approved for a 6-month access window.'
),
(
  'dddddddd-0000-0000-0000-000000000006',
  'aaaaaaaa-1111-0000-0000-000000000009',
  'cccccccc-0000-0000-0000-000000000004',
  'NexaLab AI Research Brief',
  'One-page brief for the NexaLab autonomous vehicle perception project.',
  'credentials/startup/research_brief.pdf', 'research_brief.pdf',
  'verified', 'aaaaaaaa-1111-0000-0000-000000000003', now() - interval '10 days',
  'Research project confirmed as legitimate.'
);

-- Carol: pending review
insert into user_credentials (
  id, user_id, requirement_id, name, description,
  file_url, file_name, status
) values (
  'dddddddd-0000-0000-0000-000000000007',
  'aaaaaaaa-1111-0000-0000-000000000007',
  'cccccccc-0000-0000-0000-000000000001',
  'Laser Safety Training Certificate',
  'Just completed the induction – uploading certificate now.',
  'credentials/carol/laser_safety_cert.pdf',
  'laser_safety_cert.pdf',
  'pending'
);

-- 7. AVAILABILITY SLOTS (next 30 days, weekdays 08:00-20:00 IST)
do $$
declare
  v_day date;
  v_resource_ids uuid[] := array[
    'bbbbbbbb-0000-0000-0000-000000000001'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000003'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000004'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000005'::uuid,
    'bbbbbbbb-0000-0000-0000-000000000006'::uuid
  ];
  v_created_by uuid[] := array[
    'aaaaaaaa-1111-0000-0000-000000000003'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000003'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000002'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000002'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000004'::uuid,
    'aaaaaaaa-1111-0000-0000-000000000003'::uuid
  ];
  i integer;
begin
  for v_day in
    select generate_series(current_date, current_date + interval '30 days', interval '1 day')::date
  loop
    if extract(dow from v_day) in (0, 6) then
      continue;
    end if;
    for i in 1..6 loop
      insert into availability_slots (resource_id, starts_at, ends_at, is_recurring, created_by)
      values (
        v_resource_ids[i],
        (v_day::text || ' 08:00:00+05:30')::timestamptz,
        (v_day::text || ' 20:00:00+05:30')::timestamptz,
        false,
        v_created_by[i]
      )
      on conflict do nothing;
    end loop;
  end loop;
end;
$$;

-- 8. BOOKINGS
-- B1: Alice - 3D Printer - APPROVED
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, decision_reason, decided_by, decided_at,
  priority_score, is_first_time_user
) values (
  'eeeeeeee-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000005',
  (current_date + interval '2 days' + interval '10 hours')::timestamptz,
  (current_date + interval '2 days' + interval '14 hours')::timestamptz,
  'approved',
  'Printing prototype enclosure for my capstone IoT sensor project.',
  'project',
  'Project is well-documented; approved for 4-hour session.',
  'aaaaaaaa-1111-0000-0000-000000000003',
  now() - interval '1 day',
  120, false
);

-- B2: Bob - Oscilloscope Kit - CHECKED_IN
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, decision_reason, decided_by, decided_at,
  priority_score, is_first_time_user, checked_in_at
) values (
  'eeeeeeee-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000003',
  'aaaaaaaa-1111-0000-0000-000000000006',
  (now() - interval '1 hour')::timestamptz,
  (now() + interval '3 hours')::timestamptz,
  'checked_in',
  'Debugging amplifier circuit for Signals & Systems lab assignment.',
  'coursework',
  'Auto-approved – no approval required for this resource.',
  null,
  now() - interval '1 hour 5 minutes',
  115, true,
  (now() - interval '55 minutes')::timestamptz
);

-- B3: Alice - Laser Cutter - RETURNED
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, decision_reason, decided_by, decided_at,
  priority_score, is_first_time_user, checked_in_at, returned_at
) values (
  'eeeeeeee-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-1111-0000-0000-000000000005',
  (now() - interval '7 days' + interval '9 hours')::timestamptz,
  (now() - interval '7 days' + interval '11 hours')::timestamptz,
  'returned',
  'Cutting acrylic panels for capstone prototype housing.',
  'project',
  'All credentials verified. Approved.',
  'aaaaaaaa-1111-0000-0000-000000000003',
  now() - interval '7 days' - interval '30 minutes',
  125, false,
  (now() - interval '7 days' + interval '9 hours' + interval '10 minutes')::timestamptz,
  (now() - interval '7 days' + interval '10 hours' + interval '55 minutes')::timestamptz
);

-- B4: Carol - Laser Cutter - WAITLISTED
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, waitlist_position, priority_score, is_first_time_user,
  decision_reason, decided_by, decided_at
) values (
  'eeeeeeee-0000-0000-0000-000000000004',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-1111-0000-0000-000000000007',
  (current_date + interval '3 days' + interval '9 hours')::timestamptz,
  (current_date + interval '3 days' + interval '12 hours')::timestamptz,
  'waitlisted',
  'Cutting wooden gears for ME project on mechanical clock assembly.',
  'project',
  1, 110, true,
  'Safety training certificate is still pending review. Added to waitlist.',
  'aaaaaaaa-1111-0000-0000-000000000003',
  now() - interval '2 hours'
);

-- B5: Dave - DSLR Camera Kit - CANCELLED
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, priority_score, is_first_time_user,
  cancelled_at, cancelled_by, cancellation_reason
) values (
  'eeeeeeee-0000-0000-0000-000000000005',
  'bbbbbbbb-0000-0000-0000-000000000004',
  'aaaaaaaa-1111-0000-0000-000000000008',
  (current_date + interval '1 day' + interval '14 hours')::timestamptz,
  (current_date + interval '1 day' + interval '18 hours')::timestamptz,
  'cancelled',
  'Photographing the inter-college robotics competition.',
  'general',
  100, true,
  now() - interval '3 hours',
  'aaaaaaaa-1111-0000-0000-000000000008',
  'Competition rescheduled to next month; no longer need the kit today.'
);

-- B6: NexaLab - GPU Workstation - INCIDENT
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, decision_reason, decided_by, decided_at,
  priority_score, is_first_time_user, checked_in_at
) values (
  'eeeeeeee-0000-0000-0000-000000000006',
  'bbbbbbbb-0000-0000-0000-000000000006',
  'aaaaaaaa-1111-0000-0000-000000000009',
  (now() - interval '2 days' + interval '8 hours')::timestamptz,
  (now() - interval '2 days' + interval '16 hours')::timestamptz,
  'incident',
  'Training NexaLab autonomous vehicle perception model (YOLOv9 fine-tune).',
  'commercial',
  'Pre-approval and research brief verified. Approved for 8-hour session.',
  'aaaaaaaa-1111-0000-0000-000000000003',
  now() - interval '2 days' - interval '30 minutes',
  130, false,
  (now() - interval '2 days' + interval '8 hours' + interval '5 minutes')::timestamptz
);

-- B7: Bob - Seminar Room B - CLOSED
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, decision_reason, decided_by, decided_at,
  priority_score, is_first_time_user, checked_in_at, returned_at
) values (
  'eeeeeeee-0000-0000-0000-000000000007',
  'bbbbbbbb-0000-0000-0000-000000000005',
  'aaaaaaaa-1111-0000-0000-000000000006',
  (now() - interval '5 days' + interval '13 hours')::timestamptz,
  (now() - interval '5 days' + interval '15 hours')::timestamptz,
  'closed',
  'Presenting final project to department faculty.',
  'coursework',
  'Auto-approved for seminar room.',
  null,
  now() - interval '5 days' - interval '10 minutes',
  105, false,
  (now() - interval '5 days' + interval '13 hours' + interval '5 minutes')::timestamptz,
  (now() - interval '5 days' + interval '14 hours' + interval '58 minutes')::timestamptz
);

-- B8: Dave - 3D Printer - PENDING_REVIEW
insert into bookings (
  id, resource_id, user_id, starts_at, ends_at, status,
  purpose, purpose_category, priority_score, is_first_time_user
) values (
  'eeeeeeee-0000-0000-0000-000000000008',
  'bbbbbbbb-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000008',
  (current_date + interval '4 days' + interval '10 hours')::timestamptz,
  (current_date + interval '4 days' + interval '14 hours')::timestamptz,
  'pending_review',
  'Printing a miniature architectural model for Design Studio assignment.',
  'coursework',
  120, true
);

-- 9. WAITLIST ENTRIES
insert into waitlist_entries (
  id, resource_id, user_id, booking_id,
  desired_starts_at, desired_ends_at, position
) values (
  'ffffffff-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'aaaaaaaa-1111-0000-0000-000000000007',
  'eeeeeeee-0000-0000-0000-000000000004',
  (current_date + interval '3 days' + interval '9 hours')::timestamptz,
  (current_date + interval '3 days' + interval '12 hours')::timestamptz,
  1
);

-- 10. CONDITION REPORTS
insert into condition_reports (id, booking_id, phase, reported_by, notes, photo_urls)
values
(
  '11111111-cccc-0000-0000-000000000001',
  'eeeeeeee-0000-0000-0000-000000000002',
  'before',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'All four probes are present and undamaged. Screen has a minor scratch (pre-existing, noted by previous user). '
  'Power cable intact. Calibration appears normal. Ready to use.',
  array['condition-reports/b2/before_front.jpg', 'condition-reports/b2/before_probes.jpg']
),
(
  '11111111-cccc-0000-0000-000000000002',
  'eeeeeeee-0000-0000-0000-000000000003',
  'before',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'Bed is clean. Lens appears clear with no burn marks. Exhaust fan operational. '
  'Water-cooling reservoir level nominal. Air-assist tube attached and functional.',
  array['condition-reports/b3/before_bed.jpg', 'condition-reports/b3/before_lens.jpg']
),
(
  '11111111-cccc-0000-0000-000000000003',
  'eeeeeeee-0000-0000-0000-000000000003',
  'after',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'Bed cleaned of acrylic debris. Lens inspected – no marks or contamination. '
  'Exhaust filter emptied. Machine left in standby mode. No issues observed during session.',
  array['condition-reports/b3/after_bed.jpg', 'condition-reports/b3/after_lens.jpg']
),
(
  '11111111-cccc-0000-0000-000000000004',
  'eeeeeeee-0000-0000-0000-000000000006',
  'before',
  'aaaaaaaa-1111-0000-0000-000000000009',
  'Both GPUs showing as healthy in nvidia-smi. CPU temps normal at 42°C. '
  'All cooling fans spinning. UPS shows 100% charge. No hardware warnings in system logs.',
  array['condition-reports/b6/before_nvidia_smi.jpg', 'condition-reports/b6/before_temps.jpg']
),
(
  '11111111-cccc-0000-0000-000000000005',
  'eeeeeeee-0000-0000-0000-000000000007',
  'before',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'Projector operational with clear image. All 30 chairs in place. Whiteboard clean. '
  'Air conditioning set to 22°C. Video conferencing system tested and functional.',
  array['condition-reports/b7/before_projector.jpg', 'condition-reports/b7/before_room.jpg']
),
(
  '11111111-cccc-0000-0000-000000000006',
  'eeeeeeee-0000-0000-0000-000000000007',
  'after',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'Chairs rearranged back to original layout. Whiteboard wiped clean. Projector shut down. '
  'A/C turned off. No damage or missing items. Left in better condition than found.',
  array['condition-reports/b7/after_room.jpg']
);

-- 11. INCIDENTS
insert into incidents (
  id, booking_id, resource_id, reported_by,
  type, severity, status,
  title, description,
  ai_summary_draft, ai_summary_reviewed,
  created_at
) values (
  '99999999-0000-0000-0000-000000000001',
  'eeeeeeee-0000-0000-0000-000000000006',
  'bbbbbbbb-0000-0000-0000-000000000006',
  'aaaaaaaa-1111-0000-0000-000000000009',
  'damage',
  'high',
  'open',
  'GPU 2 Hardware Fault During Training Run',
  'During the final epoch of our YOLOv9 training run, GPU 2 suddenly went offline with a PCIe error. '
  'nvidia-smi reported "ERR!" status for device 1. The training job crashed and the system became '
  'unresponsive for approximately 10 minutes before auto-rebooting. GPU 1 appears unaffected. '
  'This may be related to the brief power fluctuation we noticed at approximately 14:30.',
  'GPU 2 experienced a hardware fault (PCIe error) during a compute-intensive training session, '
  'possibly triggered by a power fluctuation. GPU 1 remains functional. System auto-recovered after reboot. '
  'Recommend hardware diagnostics by facilities team before next use.',
  false,
  now() - interval '2 days' + interval '15 hours'
);

-- 12. USAGE STATS (week_start uses Monday, matching the widget's weekStartsOn: 1)
insert into usage_stats (user_id, resource_id, week_start, hours_used, booking_count)
values
  ('aaaaaaaa-1111-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002',
   date_trunc('week', current_date - interval '7 days')::date, 2.0, 1),
  ('aaaaaaaa-1111-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000003',
   date_trunc('week', current_date)::date, 2.0, 1),
  ('aaaaaaaa-1111-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000005',
   date_trunc('week', current_date - interval '7 days')::date, 2.0, 1),
  ('aaaaaaaa-1111-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000006',
   date_trunc('week', current_date - interval '7 days')::date, 8.0, 1)
on conflict (user_id, resource_id, week_start) do update
  set hours_used = excluded.hours_used, booking_count = excluded.booking_count;

-- 13. NOTIFICATIONS
insert into notifications (id, user_id, type, title, message, entity_type, entity_id, is_read)
values
(
  '88888888-0000-0000-0000-000000000001',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'booking_approved',
  'Booking Approved – 3D Printer',
  'Your booking for the Creality Ender 5 Plus 3D Printer has been approved. '
  'Please check in at the Fab Lab 15 minutes before your slot starts.',
  'booking', 'eeeeeeee-0000-0000-0000-000000000001',
  true
),
(
  '88888888-0000-0000-0000-000000000002',
  'aaaaaaaa-1111-0000-0000-000000000005',
  'credential_verified',
  'Laser Safety Certificate Verified',
  'Your Laser Cutter Safety Training Certificate has been verified. '
  'You are now eligible to book the Epilog Fusion M2 Laser Cutter.',
  'credential', 'dddddddd-0000-0000-0000-000000000001',
  true
),
(
  '88888888-0000-0000-0000-000000000003',
  'aaaaaaaa-1111-0000-0000-000000000007',
  'booking_waitlisted',
  'Added to Waitlist – Laser Cutter',
  'Your booking for the Epilog Fusion M2 Laser Cutter has been placed on the waitlist '
  'at position #1. Your safety training certificate is still pending review. '
  'You will be notified as soon as a slot becomes available and your credentials are cleared.',
  'booking', 'eeeeeeee-0000-0000-0000-000000000004',
  false
),
(
  '88888888-0000-0000-0000-000000000004',
  'aaaaaaaa-1111-0000-0000-000000000008',
  'booking_cancelled',
  'Booking Cancelled – DSLR Camera Kit',
  'Your booking for the Canon EOS 90D DSLR Camera Kit has been successfully cancelled. '
  'No charges have been incurred.',
  'booking', 'eeeeeeee-0000-0000-0000-000000000005',
  false
),
(
  '88888888-0000-0000-0000-000000000005',
  'aaaaaaaa-1111-0000-0000-000000000003',
  'incident_reported',
  'Incident Reported: GPU 2 Hardware Fault During Training Run',
  'An incident of type "damage" (severity: high) has been reported for the GPU Workstation '
  'booking by NexaLab. Please review and take action.',
  'incident', '99999999-0000-0000-0000-000000000001',
  false
),
(
  '88888888-0000-0000-0000-000000000006',
  'aaaaaaaa-1111-0000-0000-000000000003',
  'booking_approved',
  'New Booking Pending Review – 3D Printer',
  'Dave Kulkarni has submitted a new booking request for the Creality Ender 5 Plus 3D Printer '
  'for 4 hours on ' || (current_date + interval '4 days')::date::text || '. Please review.',
  'booking', 'eeeeeeee-0000-0000-0000-000000000008',
  false
),
(
  '88888888-0000-0000-0000-000000000007',
  'aaaaaaaa-1111-0000-0000-000000000006',
  'booking_reminder',
  'Reminder: Return Oscilloscope Kit in 3 Hours',
  'Your booking for the Tektronix TBS2104 Oscilloscope Kit ends in about 3 hours. '
  'Please ensure you complete your work and return the equipment on time.',
  'booking', 'eeeeeeee-0000-0000-0000-000000000002',
  false
);

-- 14. AUDIT LOG
insert into audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
values
(
  'aaaaaaaa-1111-0000-0000-000000000005', 'alice@apex.edu',
  'booking_requested', 'booking', 'eeeeeeee-0000-0000-0000-000000000001',
  '{"resource_id": "bbbbbbbb-0000-0000-0000-000000000001", "purpose_category": "project", "priority_score": 120}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',
  'booking_approved', 'booking', 'eeeeeeee-0000-0000-0000-000000000001',
  '{"reason": "Project is well-documented; approved for 4-hour session.", "previous_status": "pending_review"}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000006', 'bob@apex.edu',
  'booking_requested', 'booking', 'eeeeeeee-0000-0000-0000-000000000002',
  '{"resource_id": "bbbbbbbb-0000-0000-0000-000000000003", "purpose_category": "coursework", "priority_score": 115}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000006', 'bob@apex.edu',
  'booking_checked_in', 'booking', 'eeeeeeee-0000-0000-0000-000000000002',
  '{"notes": "All four probes present and undamaged."}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000005', 'alice@apex.edu',
  'booking_requested', 'booking', 'eeeeeeee-0000-0000-0000-000000000003',
  '{"resource_id": "bbbbbbbb-0000-0000-0000-000000000002", "purpose_category": "project", "priority_score": 125}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',
  'booking_approved', 'booking', 'eeeeeeee-0000-0000-0000-000000000003',
  '{"reason": "All credentials verified. Approved.", "previous_status": "pending_review"}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000005', 'alice@apex.edu',
  'booking_checked_in', 'booking', 'eeeeeeee-0000-0000-0000-000000000003',
  '{"notes": "Bed is clean. Lens appears clear."}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000005', 'alice@apex.edu',
  'booking_returned', 'booking', 'eeeeeeee-0000-0000-0000-000000000003',
  '{"notes": "Bed cleaned of acrylic debris. Machine left in standby mode. No issues."}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',
  'credential_verified', 'credential', 'dddddddd-0000-0000-0000-000000000001',
  '{"review_notes": "Certificate verified. Induction completed with full marks."}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000009', 'startup@nexalab.io',
  'incident_reported', 'incident', '99999999-0000-0000-0000-000000000001',
  '{"type": "damage", "severity": "high", "booking_id": "eeeeeeee-0000-0000-0000-000000000006"}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000008', 'dave@apex.edu',
  'booking_cancelled', 'booking', 'eeeeeeee-0000-0000-0000-000000000005',
  '{"reason": "Competition rescheduled to next month."}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',
  'booking_waitlisted', 'booking', 'eeeeeeee-0000-0000-0000-000000000004',
  '{"reason": "Safety training certificate is still pending review.", "position": 1}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000003', 'owner2@apex.edu',
  'resource_created', 'resource', 'bbbbbbbb-0000-0000-0000-000000000006',
  '{"name": "NVIDIA A100 GPU Workstation", "category": "workstation"}'::jsonb
),
(
  'aaaaaaaa-1111-0000-0000-000000000001', 'admin@apex.edu',
  'user_verified', 'profile', 'aaaaaaaa-1111-0000-0000-000000000005',
  '{"verified_status": "verified", "user": "alice@apex.edu"}'::jsonb
);

-- ============================================================
-- DRY RUN: nothing is saved. After it passes with no errors,
-- change the next line to:  commit;
-- ============================================================
commit;
