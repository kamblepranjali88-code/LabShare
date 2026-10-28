import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { MapPin, Clock, Users, Shield, FileText, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookingFormClient } from '@/components/resources/booking-form-client'
import { EligibilityChecklist } from '@/components/resources/eligibility-checklist'
import { ResourceCalendar } from '@/components/resources/resource-calendar'
import type { EligibilityResult } from '@/types/database'

interface Props {
  params: { id: string }
}

export default async function ResourceDetailPage({ params }: Props) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: resource } = await supabase
    .from('resources')
    .select(
      '*, owner:profiles!resources_owner_id_fkey(full_name, email), organization:organizations(name, address), requirements:resource_requirements(*)'
    )
    .eq('id', params.id)
    .single()

  if (!resource) notFound()

  // Fetch availability slots
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('resource_id', params.id)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at')
    .limit(100)

  // Fetch existing approved/checked_in bookings for calendar
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('id, starts_at, ends_at, status, user_id')
    .eq('resource_id', params.id)
    .in('status', ['approved', 'checked_in', 'pending_review'])
    .gte('ends_at', new Date().toISOString())

  // Run eligibility check for current user
  let eligibility: EligibilityResult | null = null
  try {
    const { data } = await supabase.rpc('check_eligibility', {
      p_user_id: user.id,
      p_resource_id: params.id,
    })
    eligibility = data as EligibilityResult
  } catch {
    // Eligibility check failed gracefully
  }

  const owner = resource.owner as { full_name: string; email: string } | null
  const organization = resource.organization as { name: string; address: string } | null
  const requirements = resource.requirements ?? []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
            <p className="text-gray-500 mt-1 capitalize">{resource.category} · {organization?.name}</p>
          </div>
          {eligibility && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 ${
                eligibility.eligible
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {eligibility.eligible ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {eligibility.eligible ? 'Eligible to Book' : 'Not Eligible'}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{resource.description}</p>
              <Separator className="my-4" />
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{resource.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Max {resource.max_booking_duration_hours}h per booking</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{resource.weekly_hour_cap}h/week cap per user</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span>{resource.requires_approval ? 'Manager approval required' : 'Auto-approved'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <ResourceCalendar
                slots={slots ?? []}
                existingBookings={existingBookings ?? []}
                resourceId={resource.id}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Eligibility Checklist */}
          {eligibility && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Eligibility</CardTitle>
              </CardHeader>
              <CardContent>
                <EligibilityChecklist eligibility={eligibility} />
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {requirements.map((req) => (
                  <div key={req.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {req.type === 'training' && <Shield className="h-4 w-4 text-amber-500" />}
                      {req.type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
                      {req.type === 'membership' && <BookOpen className="h-4 w-4 text-green-500" />}
                      {req.type === 'approval' && <CheckCircle className="h-4 w-4 text-violet-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {req.name}
                        {!req.is_mandatory && (
                          <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{req.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Owner info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resource Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-gray-900">{owner?.full_name}</p>
              <p className="text-xs text-gray-500">{organization?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{organization?.address}</p>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <BookingFormClient
            resource={resource}
            eligibility={eligibility}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  )
}
