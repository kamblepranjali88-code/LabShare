'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDateTime, formatDuration, getStatusConfig } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function OwnerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  // Modal state
  const [actionModal, setActionModal] = useState<{ id: string; action: 'approve' | 'reject' | 'waitlist' } | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: resources } = await supabase.from('resources').select('id').eq('owner_id', user.id)
    const resourceIds = resources?.map(r => r.id) ?? []

    if (resourceIds.length === 0) { setLoading(false); return }

    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, starts_at, ends_at, purpose, purpose_category, priority_score, decision_reason, created_at, is_first_time_user,
        resource:resources(id, name, location, weekly_hour_cap),
        user:profiles(id, full_name, email, active_bookings_count, noshow_count, verified_status)
      `)
      .in('resource_id', resourceIds)
      .in('status', ['pending_review', 'eligibility_check', 'approved', 'waitlisted'])
      .order('priority_score', { ascending: false })
      .order('created_at', { ascending: true })
    setRequests(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAction() {
    if (!actionModal) return
    if (reason.trim().length < 10) { toast.error('Reason must be at least 10 characters'); return }
    setSubmitting(true)
    const endpoint = `/api/bookings/${actionModal.id}/${actionModal.action}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      toast.error(json.error ?? 'Action failed')
    } else {
      toast.success(`Booking ${actionModal.action}d successfully`)
      setActionModal(null)
      setReason('')
      await load()
    }
    setSubmitting(false)
  }

  const ACTION_LABELS = { approve: 'Approve', reject: 'Reject', waitlist: 'Waitlist' }
  const ACTION_COLORS = {
    approve: 'bg-green-600 hover:bg-green-700',
    reject: 'bg-red-600 hover:bg-red-700',
    waitlist: 'bg-orange-500 hover:bg-orange-600',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Queue</h1>
        <p className="text-gray-500 text-sm mt-1">Review and action booking requests for your resources</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
          <p className="text-gray-500">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const status = getStatusConfig(req.status)
            const isExp = expanded === req.id
            const isPending = req.status === 'pending_review'

            return (
              <div key={req.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {/* Header row */}
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">{req.user?.full_name ?? 'Unknown'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                      {req.is_first_time_user && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">First-time user</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.resource?.name} · {formatDateTime(req.starts_at)} – {formatDateTime(req.ends_at)}
                      {' '}({formatDuration(req.starts_at, req.ends_at)})
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{req.purpose}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">Score: {req.priority_score}</span>
                    <button
                      onClick={() => setExpanded(isExp ? null : req.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      {isExp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExp && (
                  <div className="border-t border-gray-50 px-4 py-3 bg-gray-50/50 space-y-3">
                    {/* User info */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Requester</p>
                        <p className="text-gray-700">{req.user?.email}</p>
                        <p className="text-gray-600 mt-0.5">Active bookings: {req.user?.active_bookings_count ?? 0}</p>
                        <p className="text-gray-600">No-shows: {req.user?.noshow_count ?? 0}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.user?.verified_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {req.user?.verified_status}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium mb-1">Resource</p>
                        <p className="text-gray-700">{req.resource?.name}</p>
                        <p className="text-gray-600 mt-0.5">Location: {req.resource?.location}</p>
                        <p className="text-gray-600">Weekly cap: {req.resource?.weekly_hour_cap}h</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Purpose</p>
                      <p className="text-xs text-gray-700">{req.purpose}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Category: {req.purpose_category}</p>
                    </div>
                    {req.decision_reason && (
                      <div className="bg-blue-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 font-medium">Previous decision reason:</p>
                        <p className="text-xs text-gray-700 mt-0.5">{req.decision_reason}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {isPending && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => { setActionModal({ id: req.id, action: 'approve' }); setReason('') }}
                          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => { setActionModal({ id: req.id, action: 'waitlist' }); setReason('') }}
                          className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                        >
                          <Clock className="h-3.5 w-3.5" /> Waitlist
                        </button>
                        <button
                          onClick={() => { setActionModal({ id: req.id, action: 'reject' }); setReason('') }}
                          className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                {ACTION_LABELS[actionModal.action]} Booking
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              You must provide a reason for this decision. This will be shown to the requester.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason * (minimum 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder={
                  actionModal.action === 'approve'
                    ? 'e.g. All eligibility requirements met, time slot available.'
                    : actionModal.action === 'reject'
                    ? 'e.g. Safety training certificate not verified yet.'
                    : 'e.g. No available slot for requested time, placed on waitlist.'
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{reason.length} / 10 min chars</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setActionModal(null); setReason('') }}
                className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting || reason.trim().length < 10}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${ACTION_COLORS[actionModal.action]}`}
              >
                {submitting ? 'Processing…' : ACTION_LABELS[actionModal.action]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
