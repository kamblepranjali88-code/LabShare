'use client'
import { useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Setup date-fns localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
})

interface Slot {
  id: string
  starts_at: string
  ends_at: string
}

interface ExistingBooking {
  id: string
  starts_at: string
  ends_at: string
  status: string
  user_id: string
}

interface ResourceCalendarProps {
  slots: Slot[]
  existingBookings: ExistingBooking[]
  resourceId: string
}

export function ResourceCalendar({ slots, existingBookings, resourceId }: ResourceCalendarProps) {
  const events = useMemo(() => {
    const availEvents = slots.map((slot) => ({
      id: slot.id,
      title: 'Available',
      start: parseISO(slot.starts_at),
      end: parseISO(slot.ends_at),
      type: 'available' as const,
    }))

    const bookingEvents = existingBookings.map((booking) => ({
      id: booking.id,
      title: booking.status === 'pending_review' ? 'Pending Review' : 'Booked',
      start: parseISO(booking.starts_at),
      end: parseISO(booking.ends_at),
      type: booking.status === 'pending_review' ? ('pending' as const) : ('booked' as const),
    }))

    return [...availEvents, ...bookingEvents]
  }, [slots, existingBookings])

  function eventStyleGetter(event: (typeof events)[0]) {
    if (event.type === 'available') {
      return {
        style: {
          backgroundColor: '#d1fae5',
          color: '#065f46',
          border: '1px solid #a7f3d0',
          borderRadius: '4px',
          fontSize: '11px',
        },
      }
    }
    if (event.type === 'pending') {
      return {
        style: {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #fde68a',
          borderRadius: '4px',
          fontSize: '11px',
        },
      }
    }
    return {
      style: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fecaca',
        borderRadius: '4px',
        fontSize: '11px',
      },
    }
  }

  return (
    <div className="h-96 text-sm">
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 border border-green-300 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300 inline-block" />
          Pending Review
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200 border border-red-300 inline-block" />
          Booked
        </span>
      </div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.WEEK}
        views={[Views.WEEK, Views.DAY, Views.MONTH]}
        eventPropGetter={eventStyleGetter}
        style={{ height: '100%' }}
        aria-label="Resource availability calendar"
      />
    </div>
  )
}
