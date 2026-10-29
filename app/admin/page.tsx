'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ShieldCheck, Users, AlertTriangle, CalendarCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const [stats, setStats] = useState({ totalUsers: 0, pendingVerifications: 0, openIncidents: 0, totalBookings: 0 })
  const [loading, setLoading] = useState(true)
  const [overdueRunning, setOverdueRunning] = useState(false)
  const [overdueResult, setOverdueResult] = useState<{ overdue_count: number; checked_at: string } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [usersRes, pendingRes, incRes, bookRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verified_status', 'pending'),
        supabase.from('incidents').select('id', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        totalUsers: usersRes.count ?? 0,
        pendingVerifications: pendingRes.count ?? 0,
        openIncidents: incRes.count ?? 0,
        totalBookings: bookRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  async function runOverdueCheck() {
    setOverdueRunning(true)
    const res = await fetch('/api/overdue', { method: 'POST' })
    const json = await res.json()
    if (res.ok && json.success) {
      setOverdueResult({ overdue_count: json.overdue_count, checked_at: json.checked_at })
      toast.success(`Overdue check complete: ${json.overdue_count} overdue booking(s) flagged`)
    } else {
      toast.error(json.error ?? 'Overdue check failed')
    }
    setOverdueRunning(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Platform management and oversight</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: <Users className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Verifications', value: stats.pendingVerifications, icon: <ShieldCheck className="h-5 w-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Open Incidents', value: stats.openIncidents, icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total Bookings', value: stats.totalBookings, icon: <CalendarCheck className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50' },
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

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue Check */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Overdue Check</h2>
          <p className="text-sm text-gray-500">
            Scan all active bookings that have passed their end time without being returned.
            Flags them as overdue and sends alerts.
          </p>
          {overdueResult && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 text-sm">
              <p className="font-medium text-yellow-800">
                {overdueResult.overdue_count} overdue booking(s) flagged
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Checked at {new Date(overdueResult.checked_at).toLocaleTimeString()}
              </p>
            </div>
          )}
          <button
            onClick={runOverdueCheck}
            disabled={overdueRunning}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {overdueRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
            {overdueRunning ? 'Running…' : 'Run Overdue Check'}
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Links</h2>
          <Link href="/admin/users"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
          >
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">User Management</p>
              <p className="text-xs text-gray-500">Verify users, set roles, manage accounts</p>
            </div>
          </Link>
          <Link href="/admin/audit"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
          >
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Audit Log</p>
              <p className="text-xs text-gray-500">Global append-only event history</p>
            </div>
          </Link>
          <Link href="/credentials"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors group"
          >
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Credential Review Queue</p>
              <p className="text-xs text-gray-500">Verify or reject pending credentials</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
