import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { ids, all } = await request.json().catch(() => ({ ids: [], all: false }))

  if (all) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  } else if (ids && Array.isArray(ids)) {
    await supabase.from('notifications').update({ is_read: true }).in('id', ids).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
