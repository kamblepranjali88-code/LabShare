'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Award, Upload, Clock, CheckCircle, XCircle, Plus, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Tab = 'my-credentials' | 'upload' | 'review-queue'

const MAX_FILE_MB = 5

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CredentialsPage() {
  const [tab, setTab] = useState<Tab>('my-credentials')
  const [credentials, setCredentials] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [pendingCredentials, setPendingCredentials] = useState<any[]>([])
  const [role, setRole] = useState<string>('user')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Upload form state
  const [uploading, setUploading] = useState(false)
  const [reqId, setReqId] = useState('')
  const [credName, setCredName] = useState('')
  const [credDesc, setCredDesc] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  // Review state
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [reviewing, setReviewing] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const myRole = profile?.role ?? 'user'
    setRole(myRole)

    // My own credentials
    const { data: creds, error: credsError } = await supabase
      .from('user_credentials')
      .select('*, requirement:resource_requirements(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (credsError) toast.error('Could not load credentials: ' + credsError.message)
    setCredentials(creds ?? [])

    // Requirements for the dropdown (with the resource name when available)
    let reqs: any[] | null = null
    const withResource = await supabase
      .from('resource_requirements')
      .select('id, name, type, resource_id, resource:resources(name)')
      .order('name')
    if (withResource.error) {
      const plain = await supabase
        .from('resource_requirements')
        .select('id, name, type, resource_id')
        .order('name')
      reqs = plain.data
    } else {
      reqs = withResource.data
    }
    setRequirements(reqs ?? [])

    // Review queue: managers and admins see everything, owners see their own resources only
    if (myRole === 'manager' || myRole === 'admin' || myRole === 'owner') {
      let requirementFilter: string[] | null = null

      if (myRole === 'owner') {
        const { data: myResources } = await supabase.from('resources').select('id').eq('owner_id', user.id)
        const resourceIds = myResources?.map(r => r.id) ?? []
        if (resourceIds.length === 0) {
          setPendingCredentials([])
          setLoading(false)
          return
        }
        const { data: myReqs } = await supabase
          .from('resource_requirements')
          .select('id')
          .in('resource_id', resourceIds)
        requirementFilter = myReqs?.map(r => r.id) ?? []
        if (requirementFilter.length === 0) {
          setPendingCredentials([])
          setLoading(false)
          return
        }
      }

      let query = supabase
        .from('user_credentials')
        .select('*, user:profiles!user_id(full_name, email), requirement:resource_requirements(name)')
        .eq('status', 'pending')
        .neq('user_id', user.id) // nobody reviews their own credential
        .order('created_at', { ascending: true })
      if (requirementFilter) query = query.in('requirement_id', requirementFilter)

      const { data: pending, error: pendingError } = await query
      if (pendingError) toast.error('Could not load review queue: ' + pendingError.message)
      setPendingCredentials(pending ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleRequirementChange(id: string) {
    setReqId(id)
    const picked = requirements.find(r => r.id === id)
    if (picked && !credName.trim()) setCredName(picked.name)
  }

  function resetForm() {
    setCredName(''); setCredDesc(''); setReqId(''); setExpiryDate(''); setFile(null)
    const input = document.getElementById('cred-file') as HTMLInputElement | null
    if (input) input.value = ''
  }

  async function handleUpload() {
    if (!userId) { toast.error('Please log in again'); return }
    if (!credName.trim()) { toast.error('Enter a credential name'); return }
    if (expiryDate && expiryDate < todayLocal()) { toast.error('Expiry date is in the past'); return }
    if (file && file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File is larger than ${MAX_FILE_MB} MB`)
      return
    }

    setUploading(true)
    try {
      let filePath: string | null = null
      let fileName: string | null = null

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error ?? 'Upload failed')
        // We store the storage PATH, not a URL. A signed URL is made when someone clicks "View document".
        filePath = json.data.path
        fileName = file.name
      }

      const supabase = createClient()
      const { error } = await supabase.from('user_credentials').insert({
        user_id: userId,
        requirement_id: reqId || null,
        name: credName.trim(),
        description: credDesc.trim() || null,
        file_url: filePath,
        file_name: fileName,
        status: 'pending',
        expiry_date: expiryDate || null,
      })

      if (error) throw error
      toast.success('Credential submitted. It is waiting for review.')
      resetForm()
      await load()
      setTab('my-credentials')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function openDocument(path: string) {
    const supabase = createClient()
    const { data, error } = await supabase.storage.from('credentials').createSignedUrl(path, 300)
    if (error || !data) {
      toast.error('Could not open document: ' + (error?.message ?? 'no access'))
      return
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function handleReview(credId: string, status: 'verified' | 'rejected') {
    const note = (reviewNotes[credId] ?? '').trim()
    if (status === 'rejected' && note.length < 5) {
      toast.error('Add a short note explaining why it was rejected')
      return
    }

    setReviewing(credId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setReviewing(null); return }

    const { data, error } = await supabase
      .from('user_credentials')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: note || null,
      })
      .eq('id', credId)
      .eq('status', 'pending')
      .select('id')

    setReviewing(null)
    if (error) { toast.error('Update failed: ' + error.message); return }
    if (!data || data.length === 0) {
      toast.error('Nothing changed. It may already be reviewed, or you do not have permission.')
      await load()
      return
    }
    toast.success(`Credential ${status}`)
    setReviewNotes(prev => { const next = { ...prev }; delete next[credId]; return next })
    await load()
  }

  const STATUS_CONFIG = {
    pending: { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    verified: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: 'Verified', color: 'bg-green-100 text-green-700' },
    rejected: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: 'Rejected', color: 'bg-red-100 text-red-700' },
  }

  const canReview = role === 'manager' || role === 'admin' || role === 'owner'
  const tabs: Tab[] = canReview ? ['my-credentials', 'upload', 'review-queue'] : ['my-credentials', 'upload']

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Credentials</h1>
        <p className="text-gray-500 text-sm mt-1">Upload documents, training certificates and membership proofs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'my-credentials' ? 'My credentials' : t === 'upload' ? 'Upload new' : `Review queue (${pendingCredentials.length})`}
          </button>
        ))}
      </div>

      {/* My credentials */}
      {tab === 'my-credentials' && (
        <div className="space-y-3">
          {credentials.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <Award className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No credentials uploaded yet</p>
              <button onClick={() => setTab('upload')} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mx-auto">
                <Plus className="h-3.5 w-3.5" /> Upload your first credential
              </button>
            </div>
          ) : (
            credentials.map((c) => {
              const cfg = STATUS_CONFIG[c.status as 'pending' | 'verified' | 'rejected'] ?? STATUS_CONFIG.pending
              const isExpired = !!c.expiry_date && new Date(c.expiry_date).getTime() + 86400000 < Date.now()
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      {isExpired && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Expired</span>
                      )}
                    </div>
                    {c.requirement?.name && <p className="text-xs text-gray-500 mt-0.5">For: {c.requirement.name}</p>}
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    {c.review_notes && <p className="text-xs text-gray-400 mt-1 italic">Reviewer note: {c.review_notes}</p>}
                    {c.file_url && (
                      <button
                        onClick={() => openDocument(c.file_url)}
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View document{c.file_name ? `: ${c.file_name}` : ''}
                      </button>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400">Uploaded {formatDate(c.created_at)}</p>
                      {c.expiry_date && <p className="text-xs text-gray-400">Expires {formatDate(c.expiry_date)}</p>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">{cfg.icon}</div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Upload form */}
      {tab === 'upload' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Upload credential</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related requirement (optional)</label>
            <select value={reqId} onChange={e => handleRequirementChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a requirement</option>
              {requirements.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type}){r.resource?.name ? ` for ${r.resource.name}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential name *</label>
            <input value={credName} onChange={e => setCredName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Laser Safety Certificate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea value={credDesc} onChange={e => setCredDesc(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional notes about this credential..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date (optional)</label>
            <input type="date" value={expiryDate} min={todayLocal()} onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">You can type the date directly, for example 10/30/2027.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document file (optional, up to {MAX_FILE_MB} MB)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('cred-file')?.click()}
            >
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload PDF or image'}</p>
              <input id="cred-file" type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Submitting…' : 'Submit credential'}
          </button>
        </div>
      )}

      {/* Review queue */}
      {tab === 'review-queue' && canReview && (
        <div className="space-y-3">
          {pendingCredentials.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending credentials to review</p>
            </div>
          ) : (
            pendingCredentials.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-500">By: {c.user?.full_name ?? 'Unknown'} ({c.user?.email ?? 'no email visible'})</p>
                    {c.requirement?.name && <p className="text-xs text-gray-500">Requirement: {c.requirement.name}</p>}
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    {c.file_url && (
                      <button
                        onClick={() => openDocument(c.file_url)}
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View document: {c.file_name ?? 'attachment'}
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(c.created_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review notes (required when rejecting)</label>
                  <textarea
                    value={reviewNotes[c.id] ?? ''}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Notes for the user..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(c.id, 'verified')}
                    disabled={reviewing === c.id}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => handleReview(c.id, 'rejected')}
                    disabled={reviewing === c.id}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
