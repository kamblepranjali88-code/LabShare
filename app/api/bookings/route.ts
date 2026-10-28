import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  resource_id: z.string().uuid(),
  starts_at: z.string().datetime({ local: true }).or(z.string().min(1)),
  ends_at: z.string().datetime({ local: true }).or(z.string().min(1)),
  purpose: z.string().min(20),
  purpose_category: z.enum(['coursework', 'research', 'project', 'commercial', 'general']),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { resource_id, starts_at, ends_at, purpose, purpose_category } = parsed.data

  // Normalize datetime strings to ISO format with timezone
  const startsAt = new Date(starts_at).toISOString()
  const endsAt = new Date(ends_at).toISOString()

  if (new Date(endsAt) <= new Date(startsAt)) {
    return NextResponse.json({ success: false, error: 'End time must be after start time' }, { status: 400 })
  }

  if (new Date(startsAt) <= new Date()) {
    return NextResponse.json({ success: false, error: 'Start time must be in the future' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('submit_booking_request', {
    p_user_id: user.id,
    p_resource_id: resource_id,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_purpose: purpose,
    p_purpose_category: purpose_category,
  })

  if (error) {
    console.error('submit_booking_request error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const result = data as { success: boolean; booking_id?: string; status?: string; error?: string }
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error ?? 'Booking failed' }, { status: 422 })
  }

  return NextResponse.json({ success: true, data: result }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? 'user'

  let query = supabase
    .from('bookings')
    .select('*, resource:resources(name, category, location), user:profiles!bookings_user_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  // Apply role-based filter
  if (role === 'user') {
    query = query.eq('user_id', user.id)
  } else if (role === 'owner' || role === 'manager') {
    // Show bookings for resources they own
    query = query.eq('resources.owner_id', user.id)
  }
  // admin sees all

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
