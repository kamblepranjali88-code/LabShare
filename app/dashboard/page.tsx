import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, getStatusConfig } from '@/lib/utils'
import { FairUseWidget } from '@/components/booking/fair-use-widget'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch data based on role
  let stats: { label: string; value: string | number; icon: React.ReactNode; color: string }[] = []
  let recentBookings: Array<Record<string, unknown>> = []
  let pendingCount = 0

  if (profile.role === 'user') {
    // User-specific data
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, resource:resources(name, category)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const { count: activeCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['approved', 'checked_in', 'pending_review'])

    const { count: totalCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    recentBookings = (bookings ?? []) as Array<Record<string, unknown>>
    stats = [
      { label: 'Active Bookings', value: activeCount ?? 0, icon: <CalendarCheck className="h-5 w-5" />, color: 'text-blue-600' },
      { label: 'Total Bookings', value: totalCount ?? 0, icon: <Package className="h-5 w-5" />, color: 'text-violet-600' },
      { label: 'Max Active', value: '2', icon: <Clock className="h-5 w-5" />, color: 'text-gray-600' },
    ]
  } else if (profile.role === 'admin') {
    const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true })
    const { count: bookingCount } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
    const { count: pendingVerif } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verified_status', 'pending')
    const { count: incidentCount } = await supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open')

    stats = [
      { label: 'Total Users', value: userCount ?? 0, icon: <Users className="h-5 w-5" />, color: 'text-blue-600' },
      { label: 'Total Bookings', value: bookingCount ?? 0, icon: <CalendarCheck className="h-5 w-5" />, color: 'text-violet-600' },
      { label: 'Pending Verifications', value: pendingVerif ?? 0, icon: <Clock className="h-5 w-5" />, color: 'text-yellow-600' },
      { label: 'Open Incidents', value: incidentCount ?? 0, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600' },
    ]
  } else {
    // owner / manager
    const { count: pending } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review')

    const { count: checkedIn } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'checked_in')

    const { count: resourceCount } = await supabase
      .from('resources')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)

    pendingCount = pending ?? 0
    stats = [
      { label: 'Pending Requests', value: pendingCount, icon: <Clock className="h-5 w-5" />, color: pendingCount > 0 ? 'text-yellow-600' : 'text-gray-600' },
      { label: 'Checked Out', value: checkedIn ?? 0, icon: <TrendingUp className="h-5 w-5" />, color: 'text-blue-600' },
      { label: 'My Resources', value: resourceCount ?? 0, icon: <Package className="h-5 w-5" />, color: 'text-violet-600' },
    ]

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*, resource:resources!inner(name, owner_id), user:profiles!bookings_user_id_fkey(full_name, email)')
      .eq('resources.owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    recentBookings = (bookings ?? []) as Array<Record<string, unknown>>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {profile.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {profile.role === 'user' && "Here's an overview of your resource bookings."}
          {profile.role === 'owner' && "Here's what's happening with your resources."}
          {profile.role === 'manager' && "Here's the resource management overview."}
          {profile.role === 'admin' && "System overview and administrative actions."}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {profile.role === 'user' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Account Status</p>
                  <p className="text-lg font-semibold mt-1 capitalize">{profile.verified_status}</p>
                </div>
                <CheckCircle className={`h-5 w-5 ${profile.verified_status === 'verified' ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Bookings</CardTitle>
              <Link href="/bookings" className="text-sm text-blue-600 hover:underline">View all →</Link>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No bookings yet</p>
                  <Link href="/resources" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                    Browse resources →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => {
                    const b = booking as {id: string; status: string; resource?: {name: string}; user?: {full_name: string}; starts_at: string; ends_at: string}
                    const statusCfg = getStatusConfig(b.status as never)
                    return (
                      <Link
                        key={b.id}
                        href={`/bookings/${b.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {(b.resource as {name: string} | undefined)?.name ?? 'Resource'}
                          </p>
                          {profile.role !== 'user' && (
                            <p className="text-xs text-gray-500">{(b.user as {full_name: string} | undefined)?.full_name}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(b.starts_at)}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ml-2 ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Fair Use widget or Quick Actions */}
        <div className="space-y-4">
          {profile.role === 'user' && <FairUseWidget userId={user.id} />}
          {(profile.role === 'owner' || profile.role === 'manager') && pendingCount > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">{pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}</p>
                    <p className="text-sm text-yellow-700 mt-0.5">Review and respond to booking requests</p>
                    <Link href="/owner/requests" className="text-sm text-yellow-800 font-medium hover:underline mt-2 inline-block">
                      Review requests →
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {profile.role === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/admin/users" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <Users className="h-4 w-4" /> Verify Users
                </Link>
                <Link href="/admin/audit" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  <Activity className="h-4 w-4" /> View Audit Log
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/resources" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                <Package className="h-4 w-4" /> Browse Resources
              </Link>
              <Link href="/bookings" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600">
                <CalendarCheck className="h-4 w-4" /> My Bookings
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
