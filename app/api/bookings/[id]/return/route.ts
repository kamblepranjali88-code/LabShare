import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  condition_notes: z.string().min(10, 'Condition notes must be at least 10 characters'),
  photo_urls: z.array(z.string()).default([]),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  const { data, error } = await supabase.rpc('return_booking', {
    p_actor_id: user.id,
    p_booking_id: params.id,
    p_condition_notes: parsed.data.condition_notes,
    p_photo_urls: parsed.data.photo_urls,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  const result = data as { success: boolean; error?: string }
  if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 422 })

  return NextResponse.json({ success: true })
}
