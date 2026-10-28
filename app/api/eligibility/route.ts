import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const resourceId = request.nextUrl.searchParams.get('resource_id')
  if (!resourceId) return NextResponse.json({ success: false, error: 'resource_id is required' }, { status: 400 })

  const { data, error } = await supabase.rpc('check_eligibility', {
    p_user_id: user.id,
    p_resource_id: resourceId,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data })
}
