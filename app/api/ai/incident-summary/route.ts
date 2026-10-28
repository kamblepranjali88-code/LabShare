import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ incident_id: z.string().uuid() })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['owner', 'manager', 'admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  const { data: incident } = await supabase
    .from('incidents')
    .select('*, booking:bookings(*, resource:resources(name), user:profiles!bookings_user_id_fkey(full_name)), reporter:profiles!incidents_reported_by_fkey(full_name)')
    .eq('id', parsed.data.incident_id)
    .single()

  if (!incident) return NextResponse.json({ success: false, error: 'Incident not found' }, { status: 404 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      success: true,
      data: { draft: null, ai_available: false, message: 'AI summary unavailable (ANTHROPIC_API_KEY not set)' },
    })
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are helping a lab manager draft an incident report summary.

Incident details:
- Type: ${incident.type}
- Severity: ${incident.severity}
- Title: ${incident.title}
- Description: ${incident.description}
- Reporter: ${(incident.reporter as {full_name: string} | null)?.full_name}
- Resource: ${((incident.booking as {resource?: {name: string}} | null)?.resource as {name: string} | null)?.name}
- Date: ${incident.created_at}

Write a concise, professional 2-3 sentence summary of this incident for the lab manager's records.
Do not add information not in the details above.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    const draft = message.content[0].type === 'text' ? message.content[0].text : ''

    // Store draft (never auto-apply)
    await supabase
      .from('incidents')
      .update({ ai_summary_draft: draft, ai_summary_reviewed: false })
      .eq('id', parsed.data.incident_id)

    return NextResponse.json({ success: true, data: { draft, ai_available: true } })
  } catch (err) {
    console.error('Claude API error:', err)
    return NextResponse.json({ success: true, data: { draft: null, ai_available: false } })
  }
}
