-- ============================================================
-- AUDIT LOG HELPER
-- ============================================================
create or replace function log_audit(
  p_actor_id uuid,
  p_action audit_action,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb default '{}'
) returns void language plpgsql security definer as $$
declare
  v_email text;
begin
  select email into v_email from profiles where id = p_actor_id;
  insert into audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  values (p_actor_id, v_email, p_action, p_entity_type, p_entity_id, p_details);
end;
$$;

-- ============================================================
-- NOTIFICATION HELPER
-- ============================================================
create or replace function create_notification(
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_entity_type text default null,
  p_entity_id uuid default null
) returns void language plpgsql security definer as $$
begin
  insert into notifications (user_id, type, title, message, entity_type, entity_id)
  values (p_user_id, p_type, p_title, p_message, p_entity_type, p_entity_id);
end;
$$;

-- ============================================================
-- UPDATE USAGE STATS
-- ============================================================
create or replace function update_usage_stats(
  p_user_id uuid,
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) returns void language plpgsql security definer as $$
declare
  v_week_start date;
  v_hours numeric;
begin
  v_week_start := date_trunc('week', p_starts_at)::date;
  v_hours := extract(epoch from (p_ends_at - p_starts_at)) / 3600;
  
  insert into usage_stats (user_id, resource_id, week_start, hours_used, booking_count)
  values (p_user_id, p_resource_id, v_week_start, v_hours, 1)
  on conflict (user_id, resource_id, week_start)
  do update set
    hours_used = usage_stats.hours_used + v_hours,
    booking_count = usage_stats.booking_count + 1,
    updated_at = now();
end;
$$;

-- ============================================================
-- ELIGIBILITY CHECK
-- ============================================================
create or replace function check_eligibility(
  p_user_id uuid,
  p_resource_id uuid
) returns jsonb language plpgsql security definer as $$
declare
  v_resource resources%rowtype;
  v_profile profiles%rowtype;
  v_req resource_requirements%rowtype;
  v_cred user_credentials%rowtype;
  v_result jsonb := '{"eligible": true, "checklist": [], "blocks": []}'::jsonb;
  v_checklist jsonb := '[]'::jsonb;
  v_blocks jsonb := '[]'::jsonb;
  v_item jsonb;
  v_eligible boolean := true;
  v_week_start date;
  v_hours_used numeric;
  v_active_count integer;
begin
  select * into v_resource from resources where id = p_resource_id;
  select * into v_profile from profiles where id = p_user_id;
  
  -- Check profile verified
  if v_profile.verified_status != 'verified' then
    v_eligible := false;
    v_blocks := v_blocks || jsonb_build_object(
      'type', 'profile_not_verified',
      'message', 'Your profile must be verified before booking resources.',
      'action', 'Contact admin to verify your account'
    );
  end if;

  -- Check cooldown
  if v_profile.cooldown_until is not null and v_profile.cooldown_until > now() then
    v_eligible := false;
    v_blocks := v_blocks || jsonb_build_object(
      'type', 'cooldown',
      'message', format('You are in a cooldown period until %s due to a no-show.', v_profile.cooldown_until::text),
      'action', 'Wait until cooldown expires or contact the resource owner'
    );
  end if;

  -- Check active bookings cap
  select count(*) into v_active_count
  from bookings
  where user_id = p_user_id
    and status in ('approved', 'checked_in', 'pending_review');
  
  if v_active_count >= 2 then
    v_eligible := false;
    v_blocks := v_blocks || jsonb_build_object(
      'type', 'active_bookings_cap',
      'message', format('You have %s active bookings (max 2 allowed).', v_active_count),
      'action', 'Return or cancel an existing booking first'
    );
  end if;

  -- Check weekly hour cap
  v_week_start := date_trunc('week', now())::date;
  select coalesce(sum(hours_used), 0) into v_hours_used
  from usage_stats
  where user_id = p_user_id
    and resource_id = p_resource_id
    and week_start = v_week_start;
  
  if v_hours_used >= v_resource.weekly_hour_cap then
    v_eligible := false;
    v_blocks := v_blocks || jsonb_build_object(
      'type', 'weekly_cap_exceeded',
      'message', format('You have used %s/%s hours this week for this resource.', v_hours_used, v_resource.weekly_hour_cap),
      'action', 'Wait until next week or join the waitlist'
    );
  end if;

  -- Check each requirement
  for v_req in select * from resource_requirements where resource_id = p_resource_id loop
    select * into v_cred
    from user_credentials
    where user_id = p_user_id
      and requirement_id = v_req.id
      and status = 'verified'
      and (expiry_date is null or expiry_date > current_date)
    order by created_at desc
    limit 1;

    if v_cred.id is null then
      -- Check if pending
      select * into v_cred
      from user_credentials
      where user_id = p_user_id
        and requirement_id = v_req.id
        and status = 'pending'
      order by created_at desc
      limit 1;

      if v_cred.id is not null then
        v_item := jsonb_build_object(
          'requirement_id', v_req.id,
          'name', v_req.name,
          'type', v_req.type,
          'status', 'pending',
          'message', format('%s is pending review.', v_req.name),
          'is_mandatory', v_req.is_mandatory
        );
        if v_req.is_mandatory then
          v_eligible := false;
          v_blocks := v_blocks || jsonb_build_object(
            'type', 'credential_pending',
            'message', format('%s is pending review — you cannot book until it is approved.', v_req.name),
            'action', 'Wait for review or contact the resource owner'
          );
        end if;
      else
        v_item := jsonb_build_object(
          'requirement_id', v_req.id,
          'name', v_req.name,
          'type', v_req.type,
          'status', 'missing',
          'message', format('%s is required but not submitted.', v_req.name),
          'is_mandatory', v_req.is_mandatory,
          'action', 'Upload your credential in the My Credentials section'
        );
        if v_req.is_mandatory then
          v_eligible := false;
          v_blocks := v_blocks || jsonb_build_object(
            'type', 'missing_credential',
            'message', format('Missing required %s: %s. %s', v_req.type, v_req.name, v_req.description),
            'action', 'Upload credential before booking'
          );
        end if;
      end if;
    else
      v_item := jsonb_build_object(
        'requirement_id', v_req.id,
        'name', v_req.name,
        'type', v_req.type,
        'status', 'met',
        'message', format('%s — verified.', v_req.name),
        'is_mandatory', v_req.is_mandatory
      );
    end if;
    v_checklist := v_checklist || v_item;
  end loop;

  return jsonb_build_object(
    'eligible', v_eligible,
    'checklist', v_checklist,
    'blocks', v_blocks,
    'hours_used_this_week', v_hours_used,
    'weekly_hour_cap', v_resource.weekly_hour_cap,
    'active_bookings_count', v_active_count
  );
end;
$$;

-- ============================================================
-- COMPUTE PRIORITY SCORE
-- ============================================================
create or replace function compute_priority_score(
  p_user_id uuid,
  p_resource_id uuid,
  p_purpose_category text,
  p_is_first_time boolean
) returns integer language plpgsql security definer as $$
declare
  v_score integer := 100;
  v_week_start date;
  v_hours_used numeric;
  v_recent_bookings integer;
begin
  -- Bonus: first-time user
  if p_is_first_time then
    v_score := v_score + 20;
  end if;

  -- Bonus: coursework or research purpose
  if p_purpose_category in ('coursework', 'research') then
    v_score := v_score + 15;
  elsif p_purpose_category = 'project' then
    v_score := v_score + 10;
  end if;

  -- Penalty: heavy recent usage
  v_week_start := date_trunc('week', now())::date;
  select coalesce(hours_used, 0) into v_hours_used
  from usage_stats
  where user_id = p_user_id and resource_id = p_resource_id and week_start = v_week_start;
  
  if v_hours_used > 4 then
    v_score := v_score - 20;
  elsif v_hours_used > 2 then
    v_score := v_score - 10;
  end if;

  -- Penalty: many recent bookings overall
  select count(*) into v_recent_bookings
  from bookings
  where user_id = p_user_id
    and created_at > now() - interval '30 days'
    and status in ('closed', 'returned');
  
  if v_recent_bookings > 5 then
    v_score := v_score - 15;
  end if;

  return v_score;
end;
$$;

-- ============================================================
-- SUBMIT BOOKING REQUEST
-- ============================================================
create or replace function submit_booking_request(
  p_user_id uuid,
  p_resource_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_purpose text,
  p_purpose_category text
) returns jsonb language plpgsql security definer as $$
declare
  v_eligibility jsonb;
  v_booking_id uuid;
  v_resource resources%rowtype;
  v_profile profiles%rowtype;
  v_first_time boolean;
  v_priority_score integer;
  v_conflicting integer;
  v_waitlist_position integer;
begin
  -- Check eligibility first
  v_eligibility := check_eligibility(p_user_id, p_resource_id);
  
  select * into v_resource from resources where id = p_resource_id;
  select * into v_profile from profiles where id = p_user_id;

  -- Check if user has ever booked this resource before
  select not exists(
    select 1 from bookings
    where user_id = p_user_id and resource_id = p_resource_id
  ) into v_first_time;

  v_priority_score := compute_priority_score(p_user_id, p_resource_id, p_purpose_category, v_first_time);

  -- Check for time conflicts (approved or checked_in)
  select count(*) into v_conflicting
  from bookings
  where resource_id = p_resource_id
    and status in ('approved', 'checked_in')
    and tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)');

  -- If not eligible, we still create a booking in eligibility_check state
  -- so the user knows what's missing
  if not (v_eligibility->>'eligible')::boolean then
    -- Can still submit if only pending creds (not missing), goes to eligibility_check
    -- otherwise blocked
    if v_eligibility->'blocks' @> '[{"type": "missing_credential"}]'
       or v_eligibility->'blocks' @> '[{"type": "cooldown"}]'
       or v_eligibility->'blocks' @> '[{"type": "active_bookings_cap"}]'
       or v_eligibility->'blocks' @> '[{"type": "profile_not_verified"}]' then
      return jsonb_build_object(
        'success', false,
        'error', 'Eligibility check failed',
        'eligibility', v_eligibility
      );
    end if;
  end if;

  -- Create the booking
  insert into bookings (
    resource_id, user_id, starts_at, ends_at,
    purpose, purpose_category, status,
    priority_score, is_first_time_user
  ) values (
    p_resource_id, p_user_id, p_starts_at, p_ends_at,
    p_purpose, p_purpose_category,
    case when v_conflicting > 0 then 'waitlisted'
         when not (v_eligibility->>'eligible')::boolean then 'eligibility_check'
         when v_resource.requires_approval then 'pending_review'
         else 'approved'
    end,
    v_priority_score, v_first_time
  ) returning id into v_booking_id;

  -- Handle waitlist
  if v_conflicting > 0 then
    select coalesce(max(position), 0) + 1 into v_waitlist_position
    from waitlist_entries
    where resource_id = p_resource_id
      and desired_starts_at < p_ends_at
      and desired_ends_at > p_starts_at;

    update bookings set waitlist_position = v_waitlist_position where id = v_booking_id;

    insert into waitlist_entries (resource_id, user_id, booking_id, desired_starts_at, desired_ends_at, position)
    values (p_resource_id, p_user_id, v_booking_id, p_starts_at, p_ends_at, v_waitlist_position);
  end if;

  -- Update active bookings count
  if v_conflicting = 0 then
    update profiles set active_bookings_count = active_bookings_count + 1 where id = p_user_id;
  end if;

  -- Log audit
  perform log_audit(
    p_user_id, 'booking_requested', 'booking', v_booking_id,
    jsonb_build_object('resource_id', p_resource_id, 'starts_at', p_starts_at, 'ends_at', p_ends_at,
                       'purpose_category', p_purpose_category, 'priority_score', v_priority_score)
  );

  return jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'status', (select status from bookings where id = v_booking_id),
    'waitlist_position', v_waitlist_position,
    'eligibility', v_eligibility
  );
end;
$$;

-- ============================================================
-- APPROVE BOOKING
-- ============================================================
create or replace function approve_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_reason text
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_actor_role user_role;
begin
  select role into v_actor_role from profiles where id = p_actor_id;
  if v_actor_role not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into v_booking from bookings where id = p_booking_id;
  if v_booking.status not in ('pending_review', 'eligibility_check', 'waitlisted') then
    return jsonb_build_object('success', false, 'error', format('Cannot approve booking in %s state', v_booking.status));
  end if;

  update bookings set
    status = 'approved',
    decision_reason = p_reason,
    decided_by = p_actor_id,
    decided_at = now(),
    updated_at = now()
  where id = p_booking_id;

  perform log_audit(p_actor_id, 'booking_approved', 'booking', p_booking_id,
    jsonb_build_object('reason', p_reason, 'previous_status', v_booking.status));

  perform create_notification(
    v_booking.user_id, 'booking_approved',
    'Booking Approved',
    format('Your booking has been approved. Reason: %s', p_reason),
    'booking', p_booking_id
  );

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- REJECT BOOKING
-- ============================================================
create or replace function reject_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_reason text
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_actor_role user_role;
begin
  select role into v_actor_role from profiles where id = p_actor_id;
  if v_actor_role not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into v_booking from bookings where id = p_booking_id;
  if v_booking.status not in ('pending_review', 'eligibility_check', 'waitlisted', 'approved') then
    return jsonb_build_object('success', false, 'error', format('Cannot reject booking in %s state', v_booking.status));
  end if;

  update bookings set
    status = 'rejected',
    decision_reason = p_reason,
    decided_by = p_actor_id,
    decided_at = now(),
    updated_at = now()
  where id = p_booking_id;

  update profiles set active_bookings_count = greatest(0, active_bookings_count - 1)
  where id = v_booking.user_id;

  perform log_audit(p_actor_id, 'booking_rejected', 'booking', p_booking_id,
    jsonb_build_object('reason', p_reason, 'previous_status', v_booking.status));

  perform create_notification(
    v_booking.user_id, 'booking_rejected',
    'Booking Rejected',
    format('Your booking was rejected. Reason: %s', p_reason),
    'booking', p_booking_id
  );

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- WAITLIST BOOKING
-- ============================================================
create or replace function waitlist_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_reason text,
  p_position integer
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_actor_role user_role;
begin
  select role into v_actor_role from profiles where id = p_actor_id;
  if v_actor_role not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into v_booking from bookings where id = p_booking_id;
  if v_booking.status not in ('pending_review', 'eligibility_check') then
    return jsonb_build_object('success', false, 'error', format('Cannot waitlist booking in %s state', v_booking.status));
  end if;

  update bookings set
    status = 'waitlisted',
    decision_reason = p_reason,
    waitlist_position = p_position,
    decided_by = p_actor_id,
    decided_at = now(),
    updated_at = now()
  where id = p_booking_id;

  update profiles set active_bookings_count = greatest(0, active_bookings_count - 1)
  where id = v_booking.user_id;

  perform log_audit(p_actor_id, 'booking_waitlisted', 'booking', p_booking_id,
    jsonb_build_object('reason', p_reason, 'position', p_position));

  perform create_notification(
    v_booking.user_id, 'booking_waitlisted',
    'Added to Waitlist',
    format('Your booking has been waitlisted at position #%s. Reason: %s', p_position, p_reason),
    'booking', p_booking_id
  );

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- CANCEL BOOKING + AUTO-PROMOTE WAITLIST
-- ============================================================
create or replace function cancel_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_reason text
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_next_waitlist waitlist_entries%rowtype;
begin
  select * into v_booking from bookings where id = p_booking_id;
  
  -- Only the booking user, owner, manager, or admin can cancel
  if v_booking.user_id != p_actor_id and 
     (select role from profiles where id = p_actor_id) not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if v_booking.status in ('closed', 'returned', 'cancelled', 'rejected') then
    return jsonb_build_object('success', false, 'error', format('Cannot cancel booking in %s state', v_booking.status));
  end if;

  update bookings set
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_by = p_actor_id,
    cancellation_reason = p_reason,
    updated_at = now()
  where id = p_booking_id;

  update profiles set active_bookings_count = greatest(0, active_bookings_count - 1)
  where id = v_booking.user_id;

  perform log_audit(p_actor_id, 'booking_cancelled', 'booking', p_booking_id,
    jsonb_build_object('reason', p_reason));

  -- Auto-promote first waitlisted entry for overlapping time
  select we.* into v_next_waitlist
  from waitlist_entries we
  join bookings b on b.id = we.booking_id
  where we.resource_id = v_booking.resource_id
    and b.status = 'waitlisted'
    and we.desired_starts_at < v_booking.ends_at
    and we.desired_ends_at > v_booking.starts_at
  order by we.position asc
  limit 1;

  if v_next_waitlist.id is not null then
    -- Promote to pending_review
    update bookings set
      status = 'pending_review',
      waitlist_position = null,
      decision_reason = 'Auto-promoted from waitlist: a slot became available due to cancellation.',
      updated_at = now()
    where id = v_next_waitlist.booking_id;

    update profiles set active_bookings_count = active_bookings_count + 1
    where id = v_next_waitlist.user_id;

    update waitlist_entries set promoted_at = now(), promoted_booking_id = v_next_waitlist.booking_id
    where id = v_next_waitlist.id;

    perform log_audit(null, 'waitlist_promoted', 'booking', v_next_waitlist.booking_id,
      jsonb_build_object('promoted_from_waitlist', true, 'cancelled_booking_id', p_booking_id));

    perform create_notification(
      v_next_waitlist.user_id, 'waitlist_promoted',
      'Good news! You have been promoted from the waitlist',
      'A slot opened up and your booking is now pending review. Please wait for approval.',
      'booking', v_next_waitlist.booking_id
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'waitlist_promoted', v_next_waitlist.id is not null,
    'promoted_booking_id', v_next_waitlist.booking_id
  );
end;
$$;

-- ============================================================
-- CHECK IN
-- ============================================================
create or replace function checkin_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_condition_notes text,
  p_photo_urls text[]
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where id = p_booking_id;

  if v_booking.status != 'approved' then
    return jsonb_build_object('success', false, 'error', format('Cannot check in booking in %s state', v_booking.status));
  end if;

  if v_booking.user_id != p_actor_id and
     (select role from profiles where id = p_actor_id) not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  -- Require condition notes and at least one photo
  if p_condition_notes is null or length(trim(p_condition_notes)) < 10 then
    return jsonb_build_object('success', false, 'error', 'Condition notes are required (at least 10 characters)');
  end if;

  -- Insert before-condition report
  insert into condition_reports (booking_id, phase, reported_by, notes, photo_urls)
  values (p_booking_id, 'before', p_actor_id, p_condition_notes, p_photo_urls);

  update bookings set
    status = 'checked_in',
    checked_in_at = now(),
    updated_at = now()
  where id = p_booking_id;

  perform log_audit(p_actor_id, 'booking_checked_in', 'booking', p_booking_id,
    jsonb_build_object('notes', p_condition_notes));

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- RETURN BOOKING
-- ============================================================
create or replace function return_booking(
  p_actor_id uuid,
  p_booking_id uuid,
  p_condition_notes text,
  p_photo_urls text[]
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where id = p_booking_id;

  if v_booking.status != 'checked_in' then
    return jsonb_build_object('success', false, 'error', format('Cannot return booking in %s state', v_booking.status));
  end if;

  if v_booking.user_id != p_actor_id and
     (select role from profiles where id = p_actor_id) not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if p_condition_notes is null or length(trim(p_condition_notes)) < 10 then
    return jsonb_build_object('success', false, 'error', 'Condition notes are required (at least 10 characters)');
  end if;

  insert into condition_reports (booking_id, phase, reported_by, notes, photo_urls)
  values (p_booking_id, 'after', p_actor_id, p_condition_notes, p_photo_urls);

  update bookings set
    status = 'returned',
    returned_at = now(),
    updated_at = now()
  where id = p_booking_id;

  update profiles set active_bookings_count = greatest(0, active_bookings_count - 1)
  where id = v_booking.user_id;

  -- Update usage stats
  perform update_usage_stats(v_booking.user_id, v_booking.resource_id, v_booking.starts_at, v_booking.ends_at);

  perform log_audit(p_actor_id, 'booking_returned', 'booking', p_booking_id,
    jsonb_build_object('notes', p_condition_notes));

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- CLOSE BOOKING (owner/manager confirms all ok)
-- ============================================================
create or replace function close_booking(
  p_actor_id uuid,
  p_booking_id uuid
) returns jsonb language plpgsql security definer as $$
begin
  if (select role from profiles where id = p_actor_id) not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  update bookings set status = 'closed', updated_at = now()
  where id = p_booking_id and status = 'returned';

  perform log_audit(p_actor_id, 'booking_closed', 'booking', p_booking_id, '{}');
  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- REPORT INCIDENT
-- ============================================================
create or replace function report_incident(
  p_actor_id uuid,
  p_booking_id uuid,
  p_type incident_type,
  p_severity incident_severity,
  p_title text,
  p_description text
) returns jsonb language plpgsql security definer as $$
declare
  v_booking bookings%rowtype;
  v_incident_id uuid;
begin
  select * into v_booking from bookings where id = p_booking_id;

  insert into incidents (booking_id, resource_id, reported_by, type, severity, title, description)
  values (p_booking_id, v_booking.resource_id, p_actor_id, p_type, p_severity, p_title, p_description)
  returning id into v_incident_id;

  update bookings set status = 'incident', updated_at = now()
  where id = p_booking_id;

  perform log_audit(p_actor_id, 'incident_reported', 'incident', v_incident_id,
    jsonb_build_object('type', p_type, 'severity', p_severity, 'booking_id', p_booking_id));

  -- Notify resource owner
  perform create_notification(
    (select owner_id from resources where id = v_booking.resource_id),
    'incident_reported',
    format('Incident Reported: %s', p_title),
    format('An incident of type %s (severity: %s) has been reported for booking %s.', p_type, p_severity, p_booking_id),
    'incident', v_incident_id
  );

  return jsonb_build_object('success', true, 'incident_id', v_incident_id);
end;
$$;

-- ============================================================
-- RESOLVE INCIDENT
-- ============================================================
create or replace function resolve_incident(
  p_actor_id uuid,
  p_incident_id uuid,
  p_resolution_notes text
) returns jsonb language plpgsql security definer as $$
declare
  v_incident incidents%rowtype;
begin
  if (select role from profiles where id = p_actor_id) not in ('owner', 'manager', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  select * into v_incident from incidents where id = p_incident_id;

  update incidents set
    status = 'resolved',
    resolved_by = p_actor_id,
    resolved_at = now(),
    resolution_notes = p_resolution_notes,
    updated_at = now()
  where id = p_incident_id;

  update bookings set status = 'closed', updated_at = now()
  where id = v_incident.booking_id;

  perform log_audit(p_actor_id, 'incident_resolved', 'incident', p_incident_id,
    jsonb_build_object('resolution_notes', p_resolution_notes));

  perform create_notification(
    v_incident.reported_by, 'incident_resolved',
    'Incident Resolved',
    format('The incident "%s" has been resolved. Notes: %s', v_incident.title, p_resolution_notes),
    'incident', p_incident_id
  );

  return jsonb_build_object('success', true);
end;
$$;

-- ============================================================
-- OVERDUE CHECK
-- ============================================================
create or replace function run_overdue_check()
returns jsonb language plpgsql security definer as $$
declare
  v_count integer := 0;
  v_booking bookings%rowtype;
begin
  for v_booking in
    select * from bookings
    where status = 'checked_in'
      and ends_at < now() - interval '30 minutes'
  loop
    perform create_notification(
      v_booking.user_id, 'overdue_alert',
      'Overdue Return',
      format('Your booking (ends %s) is overdue. Please return the resource immediately.', v_booking.ends_at),
      'booking', v_booking.id
    );

    -- Notify owner too
    perform create_notification(
      (select owner_id from resources where id = v_booking.resource_id),
      'overdue_alert',
      'Resource Overdue',
      format('Booking %s is overdue. The user has not returned the resource.', v_booking.id),
      'booking', v_booking.id
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('success', true, 'overdue_count', v_count, 'checked_at', now());
end;
$$;
