'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Clock, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type Status = 'pending' | 'verified' | 'rejected'

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  verified_status: Status
  created_at: string
}

const BADGE: Record<Status, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])
  const [filter, setFilter] = useState<Status>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    setIsAdmin(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, verified_status, created_at')
      .order('created_at', { ascending: false })
    if (error) toast.error('Could not load users: ' + error.message)
    setUsers((data ?? []) as UserRow[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function setStatus(id: string, status: Status) {
    setBusyId(id)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ verified_status: status })
      .eq('id', id)
      .select('id')
    setBusyId(null)

    if (error) { toast.error('Update failed: ' + error.message); return }
    if (!data || data.length === 0) {
      toast.error('Nothing changed. You may not have permission to update this profile.')
      return
    }
    toast.success(`User marked as ${status}`)
    await load()
  }

  const counts: Record<Status, number> = {
    pending: users.filter(u => u.verified_status === 'pending').length,
    verified: users.filter(u => u.verified_status === 'verified').length,
    rejected: users.filter(u => u.verified_status === 'rejected').length,
  }
  const visible = users.filter(u => u.verified_status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 p-10 text-center">
        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">Admins only</p>
        <p className="text-gray-500 text-sm mt-1">You need an admin account to manage users.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User verification</h1>
        <p className="text-gray-500 text-sm mt-1">
          New accounts start as pending and cannot book until an admin verifies them.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(['pending', 'verified', 'rejected'] as Status[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === s ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {BADGE[s].label} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {filter} users</p>
          </div>
        ) : (
          visible.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 text-sm">{u.full_name || 'No name'}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[u.verified_status].color}`}>
                    {BADGE[u.verified_status].label}
                  </span>
                  {u.role && u.role !== 'user' && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{u.role}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{u.email ?? 'no email'}</p>
                <p className="text-xs text-gray-400 mt-0.5">Signed up {formatDate(u.created_at)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {u.verified_status !== 'verified' && (
                  <button
                    onClick={() => setStatus(u.id, 'verified')}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                {u.verified_status !== 'rejected' && (
                  <button
                    onClick={() => setStatus(u.id, 'rejected')}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
