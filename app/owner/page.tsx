'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Clock, CheckCircle, Package, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default function OwnerDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, checkedOut: 0, weekBookings: 0, totalResources: 0 })
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Resources owned
      const { data: resources } = await supabase
        .from('resources')
        .select('id')
        .eq('owner_id', user.id)
      const resourceIds = resources?.map(r => r.id) ?? []

      if (resourceIds.length === 0) {
        setLoading(false)
        return
      }

      // Stats
      const now = new Date()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())

      const [pendingRes, checkedOutRes, weekRes] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).in('resource_id', resourceIds).eq('status', 'pending_review'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).in('resource_id', resourceIds).eq('status', 'checked_in'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).in('resource_id', resourceIds).gte('created_at', weekStart.toISOString()),
      ])

      setStats({
        pending: pendingRes.count ?? 0,
        checkedOut: checkedOutRes.count ?? 0,
        weekBookings: weekRes.count ?? 0,
        totalResources: resourceIds.length,
      })

      // Recent requests
      const { data: requests } = await supabase
        .from('bookings')
        .select('id, status, starts_at, ends_at, purpose, created_at, resource:resources(name), user:profiles(full_name, email)')
        .in('resource_id', resourceIds)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true })
        .limit(5)
      setRecentRequests(requests ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your resources and booking requests</p>
        </div>
        <Link
          href="/owner/resources/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Resource
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Requests', value: stats.pending, icon: <Clock className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Checked Out', value: stats.checkedOut, icon: <CheckCircle className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: "This Week's Bookings", value: stats.weekBookings, icon: <BarChart3 className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'My Resources', value: stats.totalResources, icon: <Package className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color} mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" /> Pending Requests
          </h2>
          <Link href="/owner/requests" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No pending requests</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRequests.map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.user?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-gray-500">{(r.resource as any)?.name ?? r.resource_id} · {formatDateTime(r.starts_at)}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{r.purpose}</p>
                </div>
                <Link
                  href={`/owner/requests`}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/owner/requests" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition-colors group">
          <ClipboardList className="h-6 w-6 text-blue-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600">Request Queue</p>
          <p className="text-xs text-gray-500 mt-0.5">Review, approve and reject booking requests</p>
        </Link>
        <Link href="/owner/resources" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-blue-200 transition-colors group">
          <Package className="h-6 w-6 text-blue-600 mb-2" />
          <p className="font-medium text-gray-900 text-sm group-hover:text-blue-600">My Resources</p>
          <p className="text-xs text-gray-500 mt-0.5">Manage your listed labs and equipment</p>
        </Link>
      </div>
    </div>
  )
}
