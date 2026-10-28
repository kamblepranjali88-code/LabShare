// TypeScript types generated from the Supabase schema
// These match the SQL tables defined in migrations

export type UserRole = 'user' | 'owner' | 'manager' | 'admin'
export type VerifiedStatus = 'pending' | 'verified' | 'rejected'
export type RequirementType = 'training' | 'membership' | 'document' | 'approval'
export type CredentialStatus = 'pending' | 'verified' | 'rejected'
export type BookingStatus =
  | 'requested'
  | 'eligibility_check'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in'
  | 'returned'
  | 'closed'
  | 'cancelled'
  | 'incident'
export type IncidentType = 'damage' | 'delay' | 'misuse'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'under_review' | 'resolved'
export type ConditionPhase = 'before' | 'after'
export type NotificationType =
  | 'booking_approved'
  | 'booking_rejected'
  | 'booking_waitlisted'
  | 'booking_cancelled'
  | 'waitlist_promoted'
  | 'booking_reminder'
  | 'overdue_alert'
  | 'incident_reported'
  | 'incident_resolved'
  | 'credential_verified'
  | 'credential_rejected'
  | 'system'

export interface Organization {
  id: string
  name: string
  type: string
  domain: string | null
  address: string | null
  website: string | null
  logo_url: string | null
  verified: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  org_id: string | null
  verified_status: VerifiedStatus
  bio: string | null
  phone: string | null
  active_bookings_count: number
  noshow_count: number
  cooldown_until: string | null
  created_at: string
  updated_at: string
  // joined fields
  organization?: Organization
}

export interface Resource {
  id: string
  org_id: string
  owner_id: string
  name: string
  description: string
  category: string
  location: string
  image_url: string | null
  is_active: boolean
  weekly_hour_cap: number
  max_booking_duration_hours: number
  min_notice_hours: number
  advance_booking_days: number
  requires_approval: boolean
  tags: string[]
  created_at: string
  updated_at: string
  // joined fields
  owner?: Profile
  organization?: Organization
  requirements?: ResourceRequirement[]
}

export interface ResourceRequirement {
  id: string
  resource_id: string
  type: RequirementType
  name: string
  description: string
  is_mandatory: boolean
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  resource_id: string
  starts_at: string
  ends_at: string
  is_recurring: boolean
  recurrence_rule: string | null
  created_by: string | null
  created_at: string
}

export interface UserCredential {
  id: string
  user_id: string
  requirement_id: string | null
  name: string
  description: string | null
  file_url: string | null
  file_name: string | null
  status: CredentialStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  expiry_date: string | null
  created_at: string
  updated_at: string
  // joined
  requirement?: ResourceRequirement
  reviewer?: Profile
}

export interface Booking {
  id: string
  resource_id: string
  user_id: string
  starts_at: string
  ends_at: string
  status: BookingStatus
  purpose: string
  purpose_category: string
  decision_reason: string | null
  decided_by: string | null
  decided_at: string | null
  waitlist_position: number | null
  priority_score: number
  is_first_time_user: boolean
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  checked_in_at: string | null
  returned_at: string | null
  created_at: string
  updated_at: string
  // joined
  resource?: Resource
  user?: Profile
  decider?: Profile
  condition_reports?: ConditionReport[]
  incidents?: Incident[]
}

export interface WaitlistEntry {
  id: string
  resource_id: string
  user_id: string
  booking_id: string | null
  desired_starts_at: string
  desired_ends_at: string
  position: number
  promoted_at: string | null
  promoted_booking_id: string | null
  created_at: string
}

export interface ConditionReport {
  id: string
  booking_id: string
  phase: ConditionPhase
  reported_by: string
  notes: string
  photo_urls: string[]
  created_at: string
  // joined
  reporter?: Profile
}

export interface Incident {
  id: string
  booking_id: string
  resource_id: string
  reported_by: string
  type: IncidentType
  severity: IncidentSeverity
  status: IncidentStatus
  title: string
  description: string
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  ai_summary_draft: string | null
  ai_summary_reviewed: boolean
  created_at: string
  updated_at: string
  // joined
  reporter?: Profile
  resolver?: Profile
  booking?: Booking
  resource?: Resource
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
  // joined
  actor?: Profile
}

export interface UsageStats {
  id: string
  user_id: string
  resource_id: string
  week_start: string
  hours_used: number
  booking_count: number
  updated_at: string
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean
  checklist: EligibilityChecklistItem[]
  blocks: EligibilityBlock[]
  hours_used_this_week: number
  weekly_hour_cap: number
  active_bookings_count: number
}

export interface EligibilityChecklistItem {
  requirement_id: string
  name: string
  type: RequirementType
  status: 'met' | 'pending' | 'missing'
  message: string
  is_mandatory: boolean
  action?: string
}

export interface EligibilityBlock {
  type: string
  message: string
  action: string
}

// Database type for Supabase client
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      resources: { Row: Resource; Insert: Partial<Resource>; Update: Partial<Resource> }
      resource_requirements: { Row: ResourceRequirement; Insert: Partial<ResourceRequirement>; Update: Partial<ResourceRequirement> }
      availability_slots: { Row: AvailabilitySlot; Insert: Partial<AvailabilitySlot>; Update: Partial<AvailabilitySlot> }
      user_credentials: { Row: UserCredential; Insert: Partial<UserCredential>; Update: Partial<UserCredential> }
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> }
      waitlist_entries: { Row: WaitlistEntry; Insert: Partial<WaitlistEntry>; Update: Partial<WaitlistEntry> }
      condition_reports: { Row: ConditionReport; Insert: Partial<ConditionReport>; Update: Partial<ConditionReport> }
      incidents: { Row: Incident; Insert: Partial<Incident>; Update: Partial<Incident> }
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> }
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
      usage_stats: { Row: UsageStats; Insert: Partial<UsageStats>; Update: Partial<UsageStats> }
    }
    Functions: {
      check_eligibility: { Args: { p_user_id: string; p_resource_id: string }; Returns: EligibilityResult }
      submit_booking_request: { Args: { p_user_id: string; p_resource_id: string; p_starts_at: string; p_ends_at: string; p_purpose: string; p_purpose_category: string }; Returns: { success: boolean; booking_id: string; status: string; waitlist_position?: number; eligibility: EligibilityResult } }
      approve_booking: { Args: { p_actor_id: string; p_booking_id: string; p_reason: string }; Returns: { success: boolean; error?: string } }
      reject_booking: { Args: { p_actor_id: string; p_booking_id: string; p_reason: string }; Returns: { success: boolean; error?: string } }
      cancel_booking: { Args: { p_actor_id: string; p_booking_id: string; p_reason: string }; Returns: { success: boolean; error?: string } }
      checkin_booking: { Args: { p_actor_id: string; p_booking_id: string; p_condition_notes: string; p_photo_urls: string[] }; Returns: { success: boolean; error?: string } }
      return_booking: { Args: { p_actor_id: string; p_booking_id: string; p_condition_notes: string; p_photo_urls: string[] }; Returns: { success: boolean; error?: string } }
      report_incident: { Args: { p_actor_id: string; p_booking_id: string; p_type: string; p_severity: string; p_title: string; p_description: string }; Returns: { success: boolean; incident_id: string } }
      resolve_incident: { Args: { p_actor_id: string; p_incident_id: string; p_resolution_notes: string }; Returns: { success: boolean; error?: string } }
      run_overdue_check: { Args: Record<never, never>; Returns: { success: boolean; overdue_count: number; checked_at: string } }
    }
  }
}
