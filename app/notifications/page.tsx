'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatTimeAgo } from '@/lib/utils'
import { BellOff, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNotif = any

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AnyNotif[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        load()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function markAllRead() {
    if (!userId) return
    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    if (error) {
      toast.error('Failed to mark as read')
    } else {
      setNotifications((prev: AnyNotif[]) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    }
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev: AnyNotif[]) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const ICON_MAP: Record<string, string> = {
    booking_approved: '✅',
    booking_rejected: '❌',
    booking_waitlisted: '⏳',
    booking_cancelled: '🚫',
    waitlist_promoted: '🎉',
    booking_reminder: '⏰',
    overdue_alert: '⚠️',
    incident_reported: '🔴',
    incident_resolved: '🟢',
    credential_verified: '🏅',
    credential_rejected: '❌',
    system: '📢',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <BellOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-gray-50 ${
                !n.is_read ? 'border-blue-200 bg-blue-50/40' : 'border-gray-100'
              }`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <div className="text-2xl flex-shrink-0">
                {ICON_MAP[n.type] ?? '📢'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                  {n.title}
                </p>
                {n.message && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(n.created_at)}</p>
              </div>
              {!n.is_read ? (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                </div>
              ) : (
                <Check className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
