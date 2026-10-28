import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import Image from 'next/image'

interface ConditionReport {
  id: string
  phase: string
  notes: string
  photo_urls: string[]
  created_at: string
}

interface ConditionReportDisplayProps {
  beforeReport: ConditionReport | null
  afterReport: ConditionReport | null
}

export function ConditionReportDisplay({ beforeReport, afterReport }: ConditionReportDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Condition Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          <ConditionReportCard report={beforeReport} phase="Before (Check-in)" />
          <ConditionReportCard report={afterReport} phase="After (Return)" />
        </div>
      </CardContent>
    </Card>
  )
}

function ConditionReportCard({ report, phase }: { report: ConditionReport | null; phase: string }) {
  return (
    <div className={`rounded-xl border p-4 ${report ? 'bg-white' : 'bg-gray-50'}`}>
      <p className="text-sm font-semibold text-gray-800 mb-2">{phase}</p>
      {!report ? (
        <p className="text-xs text-gray-400">Not yet recorded</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">{formatDateTime(report.created_at)}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{report.notes}</p>
          {report.photo_urls.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.photo_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
