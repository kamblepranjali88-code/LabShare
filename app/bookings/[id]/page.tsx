import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, User, CalendarCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDateTime, formatDuration, getStatusConfig } from '@/lib/utils'
import { BookingTimeline } from '@/components/booking/booking-timeline'
import { QrCodeDisplay } from '@/components/booking/qr-code-display'
import { BookingActions } from '@/components/booking/booking-actions'
import { ConditionReportDisplay } from '@/components/booking/condition-report-display'

interface Props { params: { id: string } }

export default async function BookingDetailPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      resource:resources(id, name, category, location, description, owner_id),
      user:profiles!bookings_user_id_fkey(full_name, email),
      decider:profiles!bookings_decided_by_fkey(full_name),
      condition_reports(*),
      incidents(*)
    `)
    .eq('id', params.id)
    .single()

  if (!booking) notFound()

  // Access check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isOwner = ['owner', 'manager', 'admin'].includes(profile?.role ?? '')
  const isBookingUser = booking.user_id === user.id
  if (!isBookingUser && !isOwner) redirect('/dashboard')

  // Fetch audit log for this booking
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select('*, actor:profiles!audit_log_actor_id_fkey(full_name, email)')
    .eq('entity_id', params.id)
    .order('created_at', { ascending: true })

  const statusCfg = getStatusConfig(booking.status)
  const resource = booking.resource as { id: string; name: string; category: string; location: string } | null
  const decider = booking.decider as { full_name: string } | null
  const conditionReports = (booking.condition_reports ?? []) as Array<{id: string; phase: string; notes: string; photo_urls: string[]; created_at: string}>
  const beforeReport = conditionReports.find((r) => r.phase === 'before')
  const afterReport = conditionReports.find((r) => r.phase === 'after')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors" aria-label="Back to bookings">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{resource?.name}</h1>
          <p className="text-gray-500 text-sm">Booking #{params.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <span className={`ml-auto text-sm font-medium px-3 py-1 rounded-full ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Booking Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p>{formatDateTime(booking.starts_at)}</p>
                    <p className="text-xs text-gray-400">to {formatDateTime(booking.ends_at)}</p>
                    <p className="text-xs text-gray-400">({formatDuration(booking.starts_at, booking.ends_at)})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{resource?.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="capitalize">{booking.purpose_category?.replace('_', ' ')}</span>
                </div>
                <div className="text-gray-700">
                  <p className="text-xs text-gray-500 mb-0.5">Priority Score</p>
                  <p className="font-medium">{booking.priority_score}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Purpose</p>
                <p className="text-sm text-gray-700">{booking.purpose}</p>
              </div>
              {booking.decision_reason && (
                <>
                  <Separator />
                  <div className={`p-3 rounded-lg ${booking.status === 'rejected' ? 'bg-red-50 border border-red-100' : 'bg-blue-50 border border-blue-100'}`}>
                    <p className="text-xs font-medium mb-1 text-gray-600">Decision Reason</p>
                    <p className="text-sm text-gray-800">{booking.decision_reason}</p>
                    {decider && <p className="text-xs text-gray-500 mt-1">by {decider.full_name}</p>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Condition reports */}
          {(beforeReport || afterReport) && (
            <ConditionReportDisplay beforeReport={beforeReport ?? null} afterReport={afterReport ?? null} />
          )}

          {/* Audit Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Full Audit History</CardTitle></CardHeader>
            <CardContent>
              <BookingTimeline auditLogs={auditLogs ?? []} bookingStatus={booking.status} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* QR Code */}
          {booking.status === 'approved' && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-green-600" />Check-In QR</CardTitle></CardHeader>
              <CardContent>
                <QrCodeDisplay bookingId={booking.id} />
                <p className="text-xs text-gray-400 mt-2 text-center">Show this to the lab manager when you arrive</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent>
              <BookingActions booking={booking} />
            </CardContent>
          </Card>

          {/* Waitlist info */}
          {booking.status === 'waitlisted' && booking.waitlist_position && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-orange-900">Waitlist Position #{booking.waitlist_position}</p>
                <p className="text-xs text-orange-700 mt-1">
                  You will be automatically notified if a slot opens up. Your position is FIFO — first in, first promoted.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
