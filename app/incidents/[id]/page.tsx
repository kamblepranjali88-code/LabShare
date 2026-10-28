'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle, Clock, Loader2, Bot } from 'lucide-react'
import { formatDateTime, SEVERITY_CONFIG } from '@/lib/utils'
import Link from 'next/link'

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [incident, setIncident] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState('')
  const [resolving, setResolving] = useState(false)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: inc }, { data: prof }] = await Promise.all([
        supabase
          .from('incidents')
          .select(`
            *,
            reporter:profiles!incidents_reporter_id_fkey(full_name, email),
            booking:bookings(id, starts_at, ends_at, purpose, resource:resources(name, location))
          `)
          .eq('id', id)
          .single(),
        supabase.from('profiles').select('role').eq('id', user.id).single(),
      ])
      setIncident(inc)
      setProfile(prof)
      if (inc?.ai_summary_draft) setAiSummary(inc.ai_summary_draft)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleResolve() {
    if (resolution.trim().length < 10) {
      toast.error('Resolution notes must be at least 10 characters')
      return
    }
    setResolving(true)
    const res = await fetch(`/api/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes: resolution }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.error ?? 'Failed to resolve')
    } else {
      toast.success('Incident resolved!')
      setIncident((prev: any) => ({ ...prev, status: 'resolved', resolution_notes: resolution }))
    }
    setResolving(false)
  }

  async function handleAiSummary() {
    setAiLoading(true)
    const res = await fetch('/api/ai/incident-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: id }),
    })
    const json = await res.json()
    if (res.ok && json.summary) {
      setAiSummary(json.summary)
      toast.success('AI summary generated')
    } else {
      toast.error(json.error ?? 'AI summary not available')
    }
    setAiLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (!incident) return <div className="text-center py-12 text-gray-500">Incident not found</div>

  const canResolve = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner'
  const sevCfg = SEVERITY_CONFIG[incident.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.medium

  const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Open', color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3.5 w-3.5" /> },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  }
  const statusCfg = STATUS_CFG[incident.status] ?? STATUS_CFG.open

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{incident.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.color}`}>
              {statusCfg.icon} {statusCfg.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevCfg.color}`}>
              {sevCfg.label} severity
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {incident.type}
            </span>
          </div>
        </div>
      </div>

      {/* Incident details */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">Incident Details</h2>
        <p className="text-sm text-gray-700">{incident.description}</p>
        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-50">
          <div>
            <p className="text-gray-400">Reported by</p>
            <p className="text-gray-700 font-medium mt-0.5">{incident.reporter?.full_name ?? 'Unknown'}</p>
            <p className="text-gray-500">{incident.reporter?.email}</p>
          </div>
          <div>
            <p className="text-gray-400">Reported at</p>
            <p className="text-gray-700 font-medium mt-0.5">{formatDateTime(incident.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Related booking */}
      {incident.booking && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <h2 className="font-semibold text-gray-900 text-sm">Related Booking</h2>
          <p className="text-sm text-gray-700">{incident.booking.resource?.name}</p>
          <p className="text-xs text-gray-500">{incident.booking.resource?.location}</p>
          <p className="text-xs text-gray-500">
            {formatDateTime(incident.booking.starts_at)} → {formatDateTime(incident.booking.ends_at)}
          </p>
          <p className="text-xs text-gray-400 truncate">{incident.booking.purpose}</p>
          <Link href={`/bookings/${incident.booking.id}`} className="text-xs text-blue-600 hover:underline">
            View booking →
          </Link>
        </div>
      )}

      {/* Resolution */}
      {incident.status === 'resolved' && incident.resolution_notes && (
        <div className="bg-green-50 rounded-xl border border-green-100 p-5 space-y-2">
          <h2 className="font-semibold text-green-800 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Resolution
          </h2>
          <p className="text-sm text-green-700">{incident.resolution_notes}</p>
          {incident.resolved_at && (
            <p className="text-xs text-green-500">Resolved at {formatDateTime(incident.resolved_at)}</p>
          )}
        </div>
      )}

      {/* AI Summary */}
      {canResolve && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" /> AI Summary
            </h2>
            <button
              onClick={handleAiSummary}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
              {aiLoading ? 'Generating…' : 'Generate Summary'}
            </button>
          </div>
          {aiSummary ? (
            <div className="space-y-2">
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{aiSummary}</p>
              </div>
              <p className="text-xs text-gray-400 italic">
                ⚠️ AI-generated draft — review before use. This summary is for reference only and does not constitute an official decision.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Click &quot;Generate Summary&quot; to create an AI-assisted incident summary for documentation purposes.</p>
          )}
        </div>
      )}

      {/* Resolve form */}
      {canResolve && incident.status !== 'resolved' && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">Resolve Incident</h2>
          <textarea
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            rows={4}
            placeholder="Describe how this incident was resolved, any corrective action taken, and whether the resource is ready for use..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400">{resolution.length} chars (min 10)</p>
          <button
            onClick={handleResolve}
            disabled={resolving || resolution.trim().length < 10}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {resolving ? 'Resolving…' : 'Mark as Resolved'}
          </button>
        </div>
      )}
    </div>
  )
}
