'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CalendarCheck, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Resource, EligibilityResult } from '@/types/database'
import { PURPOSE_CATEGORIES } from '@/lib/utils'
import { addHours, format } from 'date-fns'

const schema = z.object({
  starts_at: z.string().min(1, 'Start time is required'),
  ends_at: z.string().min(1, 'End time is required'),
  purpose: z.string().min(20, 'Please describe your purpose (at least 20 characters)'),
  purpose_category: z.enum(['coursework', 'research', 'project', 'commercial', 'general']),
}).refine(
  (data) => new Date(data.ends_at) > new Date(data.starts_at),
  { message: 'End time must be after start time', path: ['ends_at'] }
).refine(
  (data) => new Date(data.starts_at) > new Date(),
  { message: 'Start time must be in the future', path: ['starts_at'] }
)

type FormData = z.infer<typeof schema>

interface BookingFormClientProps {
  resource: Resource
  eligibility: EligibilityResult | null
  userId: string
}

export function BookingFormClient({ resource, eligibility, userId }: BookingFormClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; status?: string; waitlist_position?: number; message?: string } | null>(null)

  // Default: tomorrow 9am to 11am
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  const defaultStart = format(tomorrow, "yyyy-MM-dd'T'HH:mm")
  const defaultEnd = format(addHours(tomorrow, 2), "yyyy-MM-dd'T'HH:mm")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      starts_at: defaultStart,
      ends_at: defaultEnd,
      purpose_category: 'coursework',
    },
  })

  const isEligible = eligibility?.eligible ?? false

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resource.id,
          starts_at: data.starts_at,
          ends_at: data.ends_at,
          purpose: data.purpose,
          purpose_category: data.purpose_category,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? 'Failed to submit booking')
        return
      }
      setResult({
        success: true,
        status: json.data?.status,
        waitlist_position: json.data?.waitlist_position,
        message: getSuccessMessage(json.data?.status, json.data?.waitlist_position),
      })
      toast.success('Booking request submitted!')
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result?.success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CalendarCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Booking Submitted!</p>
              <p className="text-sm text-green-700 mt-1">{result.message}</p>
              <a href="/bookings" className="text-sm text-green-800 font-medium hover:underline mt-2 inline-block">
                View my bookings →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-blue-600" />
          Book this Resource
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEligible && eligibility && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              You may not meet all eligibility requirements. Review the checklist above before booking.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="starts_at" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              id="starts_at"
              type="datetime-local"
              {...register('starts_at')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
            {errors.starts_at && (
              <p className="text-red-500 text-xs mt-1" role="alert">{errors.starts_at.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="ends_at" className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              id="ends_at"
              type="datetime-local"
              {...register('ends_at')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-required="true"
            />
            {errors.ends_at && (
              <p className="text-red-500 text-xs mt-1" role="alert">{errors.ends_at.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="purpose_category" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose Category <span className="text-red-500">*</span>
            </label>
            <select
              id="purpose_category"
              {...register('purpose_category')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              aria-required="true"
            >
              {PURPOSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} {cat.priority === 'high' ? '⭐' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Coursework/Research get higher priority score</p>
          </div>
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Purpose / Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="purpose"
              {...register('purpose')}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe what you'll be using this resource for (at least 20 characters)"
              aria-required="true"
            />
            {errors.purpose && (
              <p className="text-red-500 text-xs mt-1" role="alert">{errors.purpose.message}</p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Submitting…' : 'Submit Booking Request'}
          </Button>
          <p className="text-xs text-gray-400 text-center">
            {resource.requires_approval
              ? 'Your request will be reviewed by the resource manager'
              : 'Requests for this resource are auto-approved'}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function getSuccessMessage(status?: string, position?: number): string {
  switch (status) {
    case 'approved':
      return 'Your booking has been automatically approved. Check your bookings to view the QR code.'
    case 'pending_review':
      return 'Your request is pending manager review. You will be notified once a decision is made.'
    case 'waitlisted':
      return `You have been added to the waitlist at position #${position ?? '?'}. You will be automatically notified if a slot opens up.`
    case 'eligibility_check':
      return 'Your booking is pending eligibility review. Please ensure your credentials are up to date.'
    default:
      return 'Your booking request has been submitted.'
  }
}
