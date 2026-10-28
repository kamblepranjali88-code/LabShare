'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { Camera, RotateCcw, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default function ReturnPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [beforeReport, setBeforeReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [returned, setReturned] = useState(false)
  const [returnedBookingId, setReturnedBookingId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('bookings')
        .select(`
          *, 
          resource:resources(name, location),
          user:profiles(full_name, email),
          condition_reports(*)
        `)
        .eq('id', id)
        .single()
      setBooking(data)
      const before = data?.condition_reports?.find((r: any) => r.phase === 'before')
      setBeforeReport(before ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleReturn() {
    if (notes.trim().length < 10) {
      toast.error('Please describe the condition after use (min 10 characters)')
      return
    }
    setUploading(true)
    try {
      const photoUrls: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'condition-photos')
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (res.ok) photoUrls.push(json.url)
      }

      const res = await fetch(`/api/bookings/${id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition_notes: notes, photo_urls: photoUrls }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Return failed')
      toast.success('Resource returned successfully!')
      setReturned(true)
      setReturnedBookingId(id)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (!booking) return <div className="text-center py-12 text-gray-500">Booking not found</div>

  if (returned) return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-100 p-8 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <RotateCcw className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Resource Returned!</h2>
      <p className="text-gray-500 text-sm">The after-use condition has been recorded.</p>
      <div className="flex flex-col gap-3 pt-2">
        <Link
          href={`/incidents/new?booking_id=${returnedBookingId}`}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <AlertTriangle className="h-4 w-4" /> Report Damage / Incident
        </Link>
        <Link
          href={`/bookings/${returnedBookingId}`}
          className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Booking Summary
        </Link>
      </div>
    </div>
  )

  if (booking.status !== 'checked_in') return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-100 p-8 text-center">
      <h2 className="font-semibold text-gray-900 mb-2">Cannot Return</h2>
      <p className="text-gray-500 text-sm">
        This booking has status <strong>{booking.status}</strong>. Only checked-in bookings can be returned.
      </p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Return Resource</h1>
        <p className="text-gray-500 text-sm mt-1">Document the after-use condition</p>
      </div>

      {/* Side-by-side condition comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before */}
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Before Use</p>
          {beforeReport ? (
            <>
              <p className="text-sm text-gray-700">{beforeReport.notes}</p>
              {beforeReport.photo_urls?.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {beforeReport.photo_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Photo {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                Recorded at check-in: {formatDateTime(beforeReport.created_at)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">No before-use report on record</p>
          )}
        </div>

        {/* After (form) */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">After Use</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={5}
            placeholder="Describe the condition after use. Note any changes, damage, or issues compared to before..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400">{notes.length} chars (min 10)</p>
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('return-photos')?.click()}
          >
            <Camera className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">{files.length > 0 ? `${files.length} selected` : 'Add photos'}</p>
            <input id="return-photos" type="file" multiple accept="image/*" className="hidden"
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
        </div>
      </div>

      {/* Booking info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
        <p><span className="font-medium">Resource:</span> {booking.resource?.name}</p>
        <p><span className="font-medium">User:</span> {booking.user?.full_name}</p>
        <p><span className="font-medium">Period:</span> {formatDateTime(booking.starts_at)} → {formatDateTime(booking.ends_at)}</p>
      </div>

      <button
        onClick={handleReturn}
        disabled={uploading || notes.trim().length < 10}
        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {uploading ? 'Processing…' : '✓ Confirm Return'}
      </button>
    </div>
  )
}
