'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Award, Upload, Clock, CheckCircle, XCircle, Plus, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Tab = 'my-credentials' | 'upload' | 'review-queue'

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

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile) setRole(profile.role)

    const { data: creds } = await supabase
      .from('user_credentials')
      .select('*, requirement:resource_requirements(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setCredentials(creds ?? [])

    const { data: reqs } = await supabase
      .from('resource_requirements')
      .select('id, name, type, resource_id')
      .order('name')
    setRequirements(reqs ?? [])

    if (profile?.role === 'manager' || profile?.role === 'admin') {
      const { data: pending } = await supabase
        .from('user_credentials')
        .select('*, user:profiles!user_id(full_name, email), requirement:resource_requirements(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
      setPendingCredentials(pending ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload() {
    if (!credName.trim()) { toast.error('Please enter a credential name'); return }
    setUploading(true)
    try {
      let fileUrl: string | null = null
      let fileName: string | null = null

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'credentials')
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Upload failed')
        fileUrl = json.url
        fileName = file.name
      }

      const supabase = createClient()
      const { error } = await supabase.from('user_credentials').insert({
        user_id: userId,
        requirement_id: reqId || null,
        name: credName,
        description: credDesc || null,
        file_url: fileUrl,
        file_name: fileName,
        status: 'pending',
        expiry_date: expiryDate || null,
      })

      if (error) throw error
      toast.success('Credential uploaded! Awaiting review.')
      setCredName(''); setCredDesc(''); setReqId(''); setExpiryDate(''); setFile(null)
      await load()
      setTab('my-credentials')
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleReview(credId: string, status: 'verified' | 'rejected') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('user_credentials')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_notes: reviewNotes[credId] ?? null })
      .eq('id', credId)
    if (error) { toast.error('Update failed: ' + error.message); return }
    toast.success(`Credential ${status}`)
    await load()
  }

  const STATUS_CONFIG = {
    pending: { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
    verified: { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: 'Verified', color: 'bg-green-100 text-green-700' },
    rejected: { icon: <XCircle className="h-4 w-4 text-red-500" />, label: 'Rejected', color: 'bg-red-100 text-red-700' },
  }

  const canReview = role === 'manager' || role === 'admin'

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
        {(['my-credentials', 'upload', ...(canReview ? ['review-queue'] : [])] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'my-credentials' ? 'My Credentials' : t === 'upload' ? 'Upload New' : `Review Queue (${pendingCredentials.length})`}
          </button>
        ))}
      </div>

      {/* My Credentials */}
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
              const cfg = STATUS_CONFIG[c.status as 'pending' | 'verified' | 'rejected']
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {c.requirement?.name && <p className="text-xs text-gray-500 mt-0.5">For: {c.requirement.name}</p>}
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    {c.review_notes && <p className="text-xs text-gray-400 mt-1 italic">Note: {c.review_notes}</p>}
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
          <h2 className="font-semibold text-gray-900">Upload Credential</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name *</label>
            <input value={credName} onChange={e => setCredName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Laser Safety Certificate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Requirement (optional)</label>
            <select value={reqId} onChange={e => setReqId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select requirement —</option>
              {requirements.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document File (optional)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('cred-file')?.click()}
            >
              <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-500">{file ? file.name : 'Click to upload PDF, image, or document'}</p>
              <input id="cred-file" type="file" className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Submit Credential'}
          </button>
        </div>
      )}

      {/* Review Queue */}
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
                    <p className="text-xs text-gray-500">By: {c.user?.full_name} ({c.user?.email})</p>
                    {c.requirement?.name && <p className="text-xs text-gray-500">Requirement: {c.requirement.name}</p>}
                    {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                    {c.file_url && (
                      <a href={c.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 block"
                      >
                        View Document: {c.file_name ?? 'attachment'}
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Submitted {formatDate(c.created_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review Notes (optional)</label>
                  <textarea
                    value={reviewNotes[c.id] ?? ''}
                    onChange={e => setReviewNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Optional notes for the user..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(c.id, 'verified')}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => handleReview(c.id, 'rejected')}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
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
