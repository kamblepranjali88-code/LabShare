'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CalendarCheck, AlertCircle } from 'lucide-react'
import { format, startOfWeek } from 'date-fns'
import Link from 'next/link'

const MAX_ACTIVE_BOOKINGS = 2

interface FairUseWidgetProps {
  userId: string
}

export function FairUseWidget({ userId }: FairUseWidgetProps) {
  const supabase = createClient()
  const weekStart = format(startOfWeek(new Date()), 'yyyy-MM-dd')

  const { data: usageStats, error: usageError } = useQuery({
    queryKey: ['usage-stats', userId, weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usage_stats')
        .select('*, resource:resources(name, weekly_hour_cap)')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
      if (error) throw error
      return data ?? []
    },
  })

  const { data: profile, error: profileError } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('active_bookings_count, cooldown_until')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data
    },
  })

  const { data: waitlistPositions } = useQuery({
    queryKey: ['waitlist-positions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('*, resource:resources(name)')
        .eq('user_id', userId)
        .is('promoted_at', null)
      if (error) throw error
      return data ?? []
    },
  })

  const activeBookings = profile?.active_bookings_count ?? 0
  const cooldownUntil = profile?.cooldown_until ? new Date(profile.cooldown_until) : null
  const inCooldown = cooldownUntil !== null && cooldownUntil > new Date()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          My Fair-Use Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(profileError || usageError) && (
          <p className="text-xs text-red-600">
            Could not load some usage data. Please refresh the page.
          </p>
        )}

        {/* Active bookings */}
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600 flex items-center gap-1">
              <CalendarCheck className="h-3.5 w-3.5" /> Active Bookings
            </span>
            <span className="font-medium text-gray-900">
              {activeBookings}/{MAX_ACTIVE_BOOKINGS}
            </span>
          </div>
          <Progress
            value={Math.min((activeBookings / MAX_ACTIVE_BOOKINGS) * 100, 100)}
            className="h-1.5"
          />
          {activeBookings >= MAX_ACTIVE_BOOKINGS && (
            <p className="text-xs text-yellow-600 mt-1">⚠ Maximum active bookings reached</p>
          )}
        </div>

        {/* Weekly usage per resource */}
        {usageStats && usageStats.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              This Week&apos;s Usage
            </p>
            {usageStats.map((stat) => {
              const resource = stat.resource as { name: string; weekly_hour_cap: number } | null
              const cap = resource?.weekly_hour_cap ?? 6
              const hoursUsed = Number(stat.hours_used ?? 0)
              const pct = Math.min((hoursUsed / cap) * 100, 100)
              return (
                <div key={stat.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 truncate">{resource?.name}</span>
                    <span className={`font-medium ${pct >= 100 ? 'text-red-600' : 'text-gray-700'}`}>
                      {hoursUsed.toFixed(1)}/{cap}h
                    </span>
                  </div>
                  <Progress value={pct} className={`h-1.5 ${pct >= 100 ? '[&>div]:bg-red-500' : ''}`} />
                </div>
              )
            })}
          </div>
        )}

        {/* Cooldown warning */}
        {inCooldown && cooldownUntil && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-orange-700">
              <p className="font-medium">Cooldown active</p>
              <p>Until {format(cooldownUntil, 'MMM d, h:mm a')}</p>
            </div>
          </div>
        )}

        {/* Waitlist positions */}
        {waitlistPositions && waitlistPositions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              Waitlist Positions
            </p>
            {waitlistPositions.map((entry) => {
              const resource = entry.resource as { name: string } | null
              return (
                <div key={entry.id} className="text-xs text-gray-600 flex justify-between">
                  <span className="truncate">{resource?.name}</span>
                  <span className="font-medium text-orange-600">#{entry.position}</span>
                </div>
              )
            })}
          </div>
        )}

        {usageStats?.length === 0 && activeBookings === 0 && !inCooldown && (
          <p className="text-xs text-gray-400 text-center py-2">
            No usage this week.{' '}
            <Link href="/resources" className="text-blue-600 hover:underline">
              Browse resources →
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  )
}