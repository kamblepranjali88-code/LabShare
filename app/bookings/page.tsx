import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, Package, QrCode, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime, getStatusConfig } from '@/lib/utils'
import { BookingActions } from '@/components/booking/booking-actions'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, resource:resources(id, name, category, location, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const all = bookings ?? []
  const active = all.filter((b) => ['approved', 'checked_in', 'pending_review', 'waitlisted', 'eligibility_check'].includes(b.status))
  const completed = all.filter((b) => ['returned', 'closed'].includes(b.status))
  const cancelled = all.filter((b) => ['cancelled', 'rejected'].includes(b.status))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 mt-1">Manage and track all your resource bookings</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        {([['active', active], ['all', all], ['completed', completed], ['cancelled', cancelled]] as const).map(([tab, list]) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
            {list.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No bookings here</p>
                <Link href="/resources" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                  Browse resources →
                </Link>
              </div>
            ) : (
              list.map((booking) => {
                const statusCfg = getStatusConfig(booking.status)
                const resource = booking.resource as { id: string; name: string; category: string; location: string } | null
                return (
                  <Card key={booking.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{resource?.name ?? 'Resource'}</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            {booking.waitlist_position && (
                              <span className="text-xs text-orange-600">#{booking.waitlist_position} on waitlist</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{resource?.location}</p>
                          <p className="text-sm text-gray-700 mt-2">
                            {formatDateTime(booking.starts_at)} → {formatDateTime(booking.ends_at)}
                          </p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">
                            Purpose: {booking.purpose_category.replace('_', ' ')}
                          </p>
                          {/* Decision reason */}
                          {booking.decision_reason && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2 border-l-2 border-gray-300">
                              <span className="font-medium">Decision: </span>
                              {booking.decision_reason}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Link
                            href={`/bookings/${booking.id}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View details →
                          </Link>
                          <BookingActions booking={booking} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
