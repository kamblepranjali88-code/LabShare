'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

interface UsageChartProps {
  resourceIds?: string[]
}

export function UsageChart({ resourceIds }: UsageChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get resources owned by this user if not passed
      let ids = resourceIds
      if (!ids) {
        const { data: res } = await supabase.from('resources').select('id, name').eq('owner_id', user.id)
        ids = res?.map(r => r.id) ?? []
      }
      if (ids.length === 0) { setLoading(false); return }

      // Get bookings in the last 7 weeks grouped by week
      const sevenWeeksAgo = new Date()
      sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49)

      const { data: bookings } = await supabase
        .from('bookings')
        .select('starts_at, ends_at, status, resource:resources(name)')
        .in('resource_id', ids)
        .gte('starts_at', sevenWeeksAgo.toISOString())
        .in('status', ['approved', 'checked_in', 'returned', 'closed'])

      if (!bookings) { setLoading(false); return }

      // Group by week
      const weekMap: Record<string, { week: string; bookings: number; hours: number }> = {}
      bookings.forEach((b: any) => {
        const start = new Date(b.starts_at)
        const weekStart = new Date(start)
        weekStart.setDate(start.getDate() - start.getDay())
        const weekKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!weekMap[weekKey]) weekMap[weekKey] = { week: weekKey, bookings: 0, hours: 0 }
        weekMap[weekKey].bookings++
        const hours = (new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime()) / (1000 * 60 * 60)
        weekMap[weekKey].hours += Math.round(hours * 10) / 10
      })

      const sorted = Object.values(weekMap).sort((a, b) =>
        new Date(a.week).getTime() - new Date(b.week).getTime()
      )
      setData(sorted)
      setLoading(false)
    }
    load()
  }, [resourceIds])

  if (loading) return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>
  )

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
      <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
      <p className="text-sm">No booking data yet</p>
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" radius={[3, 3, 0, 0]} />
        <Bar dataKey="hours" fill="#8b5cf6" name="Hours" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
