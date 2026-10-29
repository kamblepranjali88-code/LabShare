import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'credentials'
const MAX_BYTES = 5 * 1024 * 1024

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
  }

  const ext = EXT_BY_TYPE[file.type]
  if (!ext) {
    return NextResponse.json(
      { success: false, error: 'File must be an image (JPG, PNG, WEBP) or PDF' },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'File must be under 5MB' }, { status: 400 })
  }

  // The bucket and path are decided by the server, never by the client.
  // The first folder is always the logged-in user's id (matches the storage policies).
  const filePath = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false, contentType: file.type })
  if (uploadError) {
    return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: { path: filePath },
  })
}
