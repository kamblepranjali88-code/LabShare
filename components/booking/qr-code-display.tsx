'use client'
import { QRCodeSVG } from 'qrcode.react'
import { generateQRCodeData } from '@/lib/utils'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function QrCodeDisplay({ bookingId }: { bookingId: string }) {
  const qrData = generateQRCodeData(bookingId)

  function handleDownload() {
    const svg = document.getElementById('booking-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `booking-${bookingId.slice(0, 8)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
        <QRCodeSVG
          id="booking-qr-svg"
          value={qrData}
          size={160}
          level="M"
          aria-label={`QR code for booking ${bookingId}`}
        />
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 text-xs">
        <Download className="h-3.5 w-3.5" /> Download QR
      </Button>
    </div>
  )
}
