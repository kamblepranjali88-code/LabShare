import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import type { EligibilityResult } from '@/types/database'
import Link from 'next/link'

interface EligibilityChecklistProps {
  eligibility: EligibilityResult
}

export function EligibilityChecklist({ eligibility }: EligibilityChecklistProps) {
  return (
    <div className="space-y-3">
      {/* Overall status */}
      <div
        className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
          eligibility.eligible
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}
      >
        {eligibility.eligible ? (
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
        )}
        <span className="font-medium">
          {eligibility.eligible
            ? 'You are eligible to book this resource'
            : 'You cannot book this resource yet'}
        </span>
      </div>

      {/* Blocks */}
      {eligibility.blocks.length > 0 && (
        <div className="space-y-2">
          {eligibility.blocks.map((block, i) => (
            <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
              <p className="font-medium text-amber-900">{block.message}</p>
              {block.action && (
                <p className="text-amber-700 mt-1 flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {block.action}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Checklist items */}
      {eligibility.checklist.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requirements</p>
          {eligibility.checklist.map((item) => (
            <div key={item.requirement_id} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex-shrink-0">
                {item.status === 'met' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {item.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                {item.status === 'missing' && <XCircle className="h-4 w-4 text-red-500" />}
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    item.status === 'met'
                      ? 'text-green-900'
                      : item.status === 'pending'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                  }`}
                >
                  {item.name}
                  {!item.is_mandatory && <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.message}</p>
                {item.status === 'missing' && (
                  <Link
                    href="/credentials"
                    className="text-xs text-blue-600 hover:underline mt-0.5 inline-flex items-center gap-0.5"
                  >
                    Upload credential <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage info */}
      <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
        <p>
          This week: {eligibility.hours_used_this_week.toFixed(1)}/{eligibility.weekly_hour_cap}h used
        </p>
        <p>Active bookings: {eligibility.active_bookings_count}/2</p>
      </div>
    </div>
  )
}
