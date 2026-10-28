'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { QrCode, Camera, Upload, CheckCircle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function CheckInPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [qrMode, setQrMode] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const qrRef = useRef<any>(null)
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('bookings')
        .select('*, resource:resources(name, location), user:profiles(full_name, email)')
        .eq('id', id)
        .single()
      setBooking(data)
      setLoading(false)
    }
    load()
  }, [id])

  // QR Scanner setup
  useEffect(() => {
    if (!qrMode) return
    let scanner: any = null
    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('qr-reader')
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            try {
              const data = JSON.parse(decodedText)
              if (data.type === 'labshare-booking' && data.bookingId === id) {
                setScanResult('✅ QR code verified! Booking ID matches.')
              } else if (data.type === 'labshare-booking') {
                setScanResult('⚠️ QR code belongs to a different booking.')
              } else {
                setScanResult('❌ Not a valid LabShare QR code.')
              }
            } catch {
              setScanResult('❌ Invalid QR code')
            }
            scanner.stop()
            setQrMode(false)
          },
          () => {}
        )
      } catch (err) {
        toast.error('Could not start camera. Please check permissions.')
        setQrMode(false)
      }
    }
    startScanner()
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [qrMode, id])

  async function handleCheckin() {
    if (notes.trim().length < 10) {
      toast.error('Please describe the condition before check-in (min 10 characters)')
      return
    }
    setUploading(true)
    try {
      // Upload photos
      const photoUrls: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'condition-photos')
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        const json = await res.json()
        if (res.ok) photoUrls.push(json.url)
      }

      const res = await fetch(`/api/bookings/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition_notes: notes, photo_urls: photoUrls }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Check-in failed')
      toast.success('Checked in successfully!')
      router.push(`/bookings/${id}`)
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

  if (!booking) return (
    <div className="text-center py-12 text-gray-500">Booking not found</div>
  )

  if (booking.status !== 'approved') return (
    <div className="max-w-lg mx-auto bg-white rounded-xl border border-gray-100 p-8 text-center">
      <Clock className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
      <h2 className="font-semibold text-gray-900 mb-2">Cannot Check In</h2>
      <p className="text-gray-500 text-sm">
        This booking has status <strong>{booking.status}</strong>. Only approved bookings can be checked in.
      </p>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check In</h1>
        <p className="text-gray-500 text-sm mt-1">Verify and document the resource condition before use</p>
      </div>

      {/* Booking summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
          <CheckCircle className="h-4 w-4" />
          Booking Details
        </div>
        <p className="font-medium text-gray-900">{booking.resource?.name}</p>
        <p className="text-xs text-gray-500">{booking.resource?.location}</p>
        <p className="text-xs text-gray-500">{formatDateTime(booking.starts_at)} → {formatDateTime(booking.ends_at)}</p>
        <p className="text-xs text-gray-500">User: {booking.user?.full_name} ({booking.user?.email})</p>
        <p className="text-xs text-gray-400 font-mono">ID: {booking.id}</p>
      </div>

      {/* QR Scanner */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <QrCode className="h-4 w-4 text-blue-600" /> QR Verification (optional)
          </div>
          <button
            onClick={() => { setQrMode(!qrMode); setScanResult(null) }}
            className="text-xs text-blue-600 hover:underline"
          >
            {qrMode ? 'Stop scanner' : 'Scan QR code'}
          </button>
        </div>
        {scanResult && (
          <div className={`text-sm rounded-lg px-3 py-2 mb-3 ${
            scanResult.startsWith('✅') ? 'bg-green-50 text-green-700' :
            scanResult.startsWith('⚠️') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
          }`}>
            {scanResult}
          </div>
        )}
        {qrMode && <div id="qr-reader" className="rounded-lg overflow-hidden" style={{ minHeight: 280 }} />}
        {!qrMode && !scanResult && (
          <p className="text-xs text-gray-400">Show the user&apos;s QR code from their booking page to scan and verify.</p>
        )}
      </div>

      {/* Condition form */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <h2 className="font-semibold text-gray-900 text-sm">Pre-Use Condition Report</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition Notes * <span className="text-gray-400 font-normal">(min 10 chars)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe the current condition of the resource. Note any existing damage, wear, or issues..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{notes.length} chars</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condition Photos (optional)
          </label>
          <div
            className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('checkin-photos')?.click()}
          >
            <Camera className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">
              {files.length > 0 ? `${files.length} file(s) selected` : 'Click to add photos'}
            </p>
            <input
              id="checkin-photos"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => setFiles(Array.from(e.target.files ?? []))}
            />
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((f, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleCheckin}
          disabled={uploading || notes.trim().length < 10}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Processing…' : '✓ Confirm Check-In'}
        </button>
      </div>
    </div>
  )
}
