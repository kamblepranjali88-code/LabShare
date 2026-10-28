import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({ query: z.string().min(5, 'Query must be at least 5 characters') })

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 })

  // Fetch all resources from DB
  const { data: resources } = await supabase
    .from('resources')
    .select('id, name, description, category, location, tags, requirements:resource_requirements(name, type)')
    .eq('is_active', true)

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback: simple keyword match
    const query = parsed.data.query.toLowerCase()
    const ranked = (resources ?? [])
      .map((r) => ({
        ...r,
        score: (r.name.toLowerCase().includes(query) ? 3 : 0) +
               (r.description.toLowerCase().includes(query) ? 2 : 0) +
               (r.category.toLowerCase().includes(query) ? 1 : 0),
        reason: 'Matched by keyword search (AI unavailable — ANTHROPIC_API_KEY not set)',
        ai_generated: false,
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    return NextResponse.json({ success: true, data: ranked, ai_available: false })
  }

  // Use Claude API for smart matching
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are a resource matching assistant for a lab-sharing platform.
    
User's need: "${parsed.data.query}"

Available resources (as JSON):
${JSON.stringify(resources, null, 2)}

Rank the top 5 most relevant resources for this user's need. 
Respond with a JSON array of objects: { "id": "...", "reason": "one-sentence plain-English reason why this resource matches" }
Only include genuinely relevant resources. If fewer than 5 match, return fewer.
Do not include any text outside the JSON array.`

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected Claude response type')

    const rankings = JSON.parse(content.text) as { id: string; reason: string }[]

    // Enrich with full resource data
    const enriched = rankings.map((r) => ({
      ...resources?.find((res) => res.id === r.id),
      reason: r.reason,
      ai_generated: true,
    })).filter((r) => r.id)

    return NextResponse.json({ success: true, data: enriched, ai_available: true })
  } catch (err) {
    console.error('Claude API error:', err)
    // Fall back to keyword search
    const query = parsed.data.query.toLowerCase()
    const ranked = (resources ?? [])
      .filter((r) => r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query))
      .slice(0, 5)
      .map((r) => ({ ...r, reason: 'Matched by keyword (AI unavailable)', ai_generated: false }))
    return NextResponse.json({ success: true, data: ranked, ai_available: false })
  }
}
