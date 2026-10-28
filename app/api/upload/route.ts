import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = (formData.get('bucket') as string) ?? 'credentials'
  const path = formData.get('path') as string | null

  if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })

  // Validate file type and size
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ success: false, error: 'File must be an image (JPG, PNG, WEBP) or PDF' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: 'File must be under 10MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filePath = path ?? `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
  if (uploadError) return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })

  // Generate a signed URL valid for 1 hour (for private buckets)
  const { data: signedUrl } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600)

  return NextResponse.json({
    success: true,
    data: { path: filePath, signed_url: signedUrl?.signedUrl },
  })
}
