import { CheckCircle, Clock, XCircle, AlertTriangle, RefreshCw, ArrowRightCircle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface AuditLog {
  id: string
  action: string
  actor?: { full_name: string; email: string } | null
  actor_email?: string | null
  details: Record<string, unknown>
  created_at: string
}

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  booking_requested: { label: 'Booking Requested', icon: <Clock className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
  eligibility_checked: { label: 'Eligibility Checked', icon: <CheckCircle className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-50' },
  booking_approved: { label: 'Approved', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
  booking_rejected: { label: 'Rejected', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
  booking_waitlisted: { label: 'Waitlisted', icon: <Clock className="h-4 w-4" />, color: 'text-orange-600 bg-orange-50' },
  booking_cancelled: { label: 'Cancelled', icon: <XCircle className="h-4 w-4" />, color: 'text-gray-600 bg-gray-50' },
  booking_checked_in: { label: 'Checked In', icon: <ArrowRightCircle className="h-4 w-4" />, color: 'text-violet-600 bg-violet-50' },
  booking_returned: { label: 'Returned', icon: <RefreshCw className="h-4 w-4" />, color: 'text-teal-600 bg-teal-50' },
  booking_closed: { label: 'Closed', icon: <CheckCircle className="h-4 w-4" />, color: 'text-slate-600 bg-slate-50' },
  incident_reported: { label: 'Incident Reported', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600 bg-red-50' },
  incident_resolved: { label: 'Incident Resolved', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600 bg-green-50' },
  waitlist_promoted: { label: 'Promoted from Waitlist', icon: <ArrowRightCircle className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50' },
}

interface BookingTimelineProps {
  auditLogs: AuditLog[]
  bookingStatus: string
}

export function BookingTimeline({ auditLogs, bookingStatus }: BookingTimelineProps) {
  if (auditLogs.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No history yet</p>
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" aria-hidden="true" />
      <ol className="space-y-4 relative" aria-label="Booking history timeline">
        {auditLogs.map((log, i) => {
          const cfg = ACTION_LABELS[log.action] ?? {
            label: log.action.replace(/_/g, ' '),
            icon: <Clock className="h-4 w-4" />,
            color: 'text-gray-600 bg-gray-50',
          }
          const actorName = (log.actor as { full_name: string } | null)?.full_name ?? log.actor_email ?? 'System'
          return (
            <li key={log.id} className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                  <time className="text-xs text-gray-400 flex-shrink-0" dateTime={log.created_at}>
                    {formatDateTime(log.created_at)}
                  </time>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">by {actorName}</p>
                {/* Show reason / details */}
                {(log.details as Record<string, unknown>)?.reason && (
                  <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded p-1.5">
                    &ldquo;{String((log.details as Record<string, unknown>).reason)}&rdquo;
                  </p>
                )}
                {(log.details as Record<string, unknown>)?.position && (
                  <p className="text-xs text-orange-600 mt-1">Waitlist position #{String((log.details as Record<string, unknown>).position)}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
