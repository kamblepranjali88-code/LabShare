import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import type { BookingStatus } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy h:mm a')
}

export function formatTimeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function formatDuration(startAt: string, endAt: string): string {
  const start = parseISO(startAt)
  const end = parseISO(endAt)
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours === 1) return '1 hour'
  return `${hours.toFixed(1)} hours`
}

// Status badge styles
export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; description: string }
> = {
  requested: { label: 'Requested', color: 'bg-gray-100 text-gray-700', description: 'Booking submitted' },
  eligibility_check: { label: 'Eligibility Check', color: 'bg-yellow-100 text-yellow-700', description: 'Checking your credentials' },
  pending_review: { label: 'Pending Review', color: 'bg-blue-100 text-blue-700', description: 'Waiting for manager review' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', description: 'Booking approved' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', description: 'Booking was rejected' },
  waitlisted: { label: 'Waitlisted', color: 'bg-orange-100 text-orange-700', description: 'On the waitlist' },
  checked_in: { label: 'Checked In', color: 'bg-purple-100 text-purple-700', description: 'Resource is in use' },
  returned: { label: 'Returned', color: 'bg-teal-100 text-teal-700', description: 'Resource returned' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700', description: 'Booking completed' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', description: 'Booking was cancelled' },
  incident: { label: 'Incident', color: 'bg-red-100 text-red-700', description: 'Incident reported' },
}

export function getStatusConfig(status: BookingStatus) {
  return BOOKING_STATUS_CONFIG[status] ?? { label: status, color: 'bg-gray-100 text-gray-700', description: '' }
}

// Purpose categories with labels
export const PURPOSE_CATEGORIES = [
  { value: 'coursework', label: 'Coursework / Assignment', priority: 'high' },
  { value: 'research', label: 'Research Project', priority: 'high' },
  { value: 'project', label: 'Personal/Team Project', priority: 'medium' },
  { value: 'commercial', label: 'Commercial / Startup', priority: 'low' },
  { value: 'general', label: 'General Use', priority: 'low' },
] as const

// Resource categories
export const RESOURCE_CATEGORIES = [
  'equipment',
  'space',
  'kit',
  'workstation',
] as const

// Incident severity colors
export const SEVERITY_CONFIG = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
} as const

export function generateQRCodeData(bookingId: string) {
  return JSON.stringify({
    type: 'labshare-booking',
    bookingId,
    timestamp: Date.now(),
  })
}
