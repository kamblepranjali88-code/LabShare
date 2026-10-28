import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ reason: z.string().min(5, 'Reason is required') })

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  const { data, error } = await supabase.rpc('cancel_booking', {
    p_actor_id: user.id,
    p_booking_id: params.id,
    p_reason: parsed.data.reason,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  const result = data as { success: boolean; error?: string; waitlist_promoted?: boolean }
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 422 })

  return NextResponse.json({ success: true, waitlist_promoted: result.waitlist_promoted })
}
