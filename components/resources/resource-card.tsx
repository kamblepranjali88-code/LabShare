import Link from 'next/link'
import {
  Package,
  Cpu,
  Camera,
  DoorOpen,
  Radio,
  MapPin,
  Clock,
  Shield,
  FileText,
  BookOpen,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Resource } from '@/types/database'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  equipment: <Package className="h-6 w-6 text-blue-600" />,
  workstation: <Cpu className="h-6 w-6 text-violet-600" />,
  kit: <Camera className="h-6 w-6 text-green-600" />,
  space: <DoorOpen className="h-6 w-6 text-orange-600" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  equipment: 'bg-blue-50 border-blue-100',
  workstation: 'bg-violet-50 border-violet-100',
  kit: 'bg-green-50 border-green-100',
  space: 'bg-orange-50 border-orange-100',
}

const REQ_ICONS: Record<string, React.ReactNode> = {
  training: <Shield className="h-3 w-3" />,
  document: <FileText className="h-3 w-3" />,
  membership: <BookOpen className="h-3 w-3" />,
  approval: <CheckCircle className="h-3 w-3" />,
}

interface ResourceCardProps {
  resource: Resource
  userId?: string
}

export function ResourceCard({ resource, userId }: ResourceCardProps) {
  const icon = CATEGORY_ICONS[resource.category] ?? <Package className="h-6 w-6 text-gray-500" />
  const bgColor = CATEGORY_COLORS[resource.category] ?? 'bg-gray-50 border-gray-100'
  const requirements = resource.requirements ?? []
  const mandatoryReqs = requirements.filter((r) => r.is_mandatory)

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      {/* Resource image or category icon */}
      <div className={`h-40 ${bgColor} border-b flex items-center justify-center relative`}>
        {resource.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resource.image_url}
            alt={resource.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              {icon}
            </div>
          </div>
        )}
        <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-0.5 rounded-full bg-white/90 border capitalize`}>
          {resource.category}
        </span>
      </div>

      <CardContent className="pt-4 pb-5">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 group-hover:text-blue-600 transition-colors">
          {resource.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{resource.description}</p>

        {/* Location and hour cap */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {resource.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {resource.weekly_hour_cap}h/week cap
          </span>
        </div>

        {/* Requirements */}
        {mandatoryReqs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {mandatoryReqs.map((req) => (
              <span
                key={req.id}
                className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full"
                title={req.description}
              >
                {REQ_ICONS[req.type]}
                {req.name}
              </span>
            ))}
          </div>
        )}
        {mandatoryReqs.length === 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-4">
            <CheckCircle className="h-3.5 w-3.5" />
            No special requirements
          </div>
        )}

        <Link
          href={`/resources/${resource.id}`}
          className="flex items-center justify-center gap-1 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          View & Book
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
