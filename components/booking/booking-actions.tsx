'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { QrCode, RotateCcw, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import Link from 'next/link'
import type { Booking } from '@/types/database'
import { sparkleBurst, celebrate } from '@/lib/effects'

interface BookingActionsProps {
  booking: Booking
}

export function BookingActions({ booking }: BookingActionsProps) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [loading, setLoading] = useState(false)

  const canCancel = ['approved', 'pending_review', 'waitlisted', 'eligibility_check', 'requested'].includes(booking.status)
  const canCheckin = booking.status === 'approved'
  const canReturn = booking.status === 'checked_in'
  const canReport = booking.status === 'checked_in'

  async function handleCancel() {
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      toast.error('Please provide a reason for cancellation')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error ?? 'Failed to cancel booking')
        return
      }
      toast.success(
        json.waitlist_promoted
          ? 'Booking cancelled — waitlisted user promoted! 🎉'
          : 'Booking cancelled successfully'
      )
      if (json.waitlist_promoted) celebrate()
      setCancelOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {canCheckin && (
        <Link href={`/checkin/${booking.id}`}>
          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
            <QrCode className="h-3.5 w-3.5" /> Check In
          </Button>
        </Link>
      )}
      {canReturn && (
        <Link href={`/checkin/${booking.id}/return`}>
          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Return
          </Button>
        </Link>
      )}
      {canReport && (
        <Link href={`/incidents/new?booking_id=${booking.id}`}>
          <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 text-red-600 hover:text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
          </Button>
        </Link>
      )}
      {canCancel && (
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
          onClick={() => setCancelOpen(true)}
        >
          <XCircle className="h-3.5 w-3.5" /> Cancel
        </Button>
      )}

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancellation. If this is an approved booking, the first waitlisted user will be automatically promoted.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancel-reason"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Why are you cancelling this booking?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling…' : 'Cancel Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
