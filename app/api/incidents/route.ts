import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  booking_id: z.string().uuid(),
  type: z.enum(['damage', 'delay', 'misuse']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string().min(5),
  description: z.string().min(20),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  const { data, error } = await supabase.rpc('report_incident', {
    p_actor_id: user.id,
    p_booking_id: parsed.data.booking_id,
    p_type: parsed.data.type,
    p_severity: parsed.data.severity,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  const result = data as { success: boolean; incident_id?: string; error?: string }
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 422 })

  return NextResponse.json({ success: true, data: { incident_id: result.incident_id } }, { status: 201 })
}
