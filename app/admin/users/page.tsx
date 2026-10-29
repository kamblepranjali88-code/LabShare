'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Users, ShieldCheck, ShieldOff, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ROLES = ['user', 'owner', 'manager', 'admin']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    let query = supabase
      .from('profiles')
      .select('*, organization:organizations(name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('verified_status', filter)
    const { data } = await query
    setUsers(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  async function updateUser(id: string, updates: Record<string, string>) {
    setUpdating(id)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update(updates).eq('id', id)
    if (error) {
      toast.error('Update failed: ' + error.message)
    } else {
      toast.success('User updated')
      await load()
    }
    setUpdating(null)
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  const ROLE_COLORS: Record<string, string> = {
    user: 'bg-gray-100 text-gray-600',
    owner: 'bg-blue-100 text-blue-700',
    manager: 'bg-purple-100 text-purple-700',
    admin: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Verify accounts, set roles, manage users</p>
        </div>
        <span className="text-sm text-gray-500">{filtered.length} user(s)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No users found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Org</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.full_name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.organization?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={u.role}
                        disabled={updating === u.id}
                        onChange={e => updateUser(u.id, { role: e.target.value })}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[u.verified_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.verified_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {u.verified_status !== 'verified' && (
                          <button
                            onClick={() => updateUser(u.id, { verified_status: 'verified' })}
                            disabled={updating === u.id}
                            className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Verify"
                          >
                            <ShieldCheck className="h-3 w-3" /> Verify
                          </button>
                        )}
                        {u.verified_status !== 'rejected' && (
                          <button
                            onClick={() => updateUser(u.id, { verified_status: 'rejected' })}
                            disabled={updating === u.id}
                            className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <ShieldOff className="h-3 w-3" /> Reject
                          </button>
                        )}
                        {u.verified_status !== 'pending' && (
                          <button
                            onClick={() => updateUser(u.id, { verified_status: 'pending' })}
                            disabled={updating === u.id}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
