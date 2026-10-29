'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 25

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
    if (actionFilter) query = query.ilike('action', `%${actionFilter}%`)
    if (search) query = query.or(`actor_email.ilike.%${search}%,entity_type.ilike.%${search}%,entity_id.ilike.%${search}%`)
    const { data, count } = await query
    setLogs(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, actionFilter])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const ACTION_COLORS: Record<string, string> = {
    booking_submitted: 'bg-blue-100 text-blue-700',
    booking_approved: 'bg-green-100 text-green-700',
    booking_rejected: 'bg-red-100 text-red-700',
    booking_waitlisted: 'bg-orange-100 text-orange-700',
    booking_cancelled: 'bg-gray-100 text-gray-600',
    booking_checked_in: 'bg-purple-100 text-purple-700',
    booking_returned: 'bg-teal-100 text-teal-700',
    incident_reported: 'bg-red-100 text-red-700',
    incident_resolved: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-sm mt-1">
          Append-only event history — {total} total events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search by actor, entity type, or ID…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <input
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0) }}
          placeholder="Filter by action…"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No audit log entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 align-top">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 truncate max-w-32">{log.actor_email ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-600 capitalize">{log.entity_type}</p>
                      <p className="text-gray-400 font-mono truncate max-w-24">{log.entity_id?.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {log.details && Object.keys(log.details).length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">View details</summary>
                          <pre className="mt-1 text-gray-500 text-xs overflow-auto max-h-32 bg-gray-50 rounded p-2">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {totalPages} · {total} events
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
