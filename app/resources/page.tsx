import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Search, Filter, Package, Cpu, Camera, Radio, MonitorSpeaker, DoorOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Resource } from '@/types/database'
import { ResourceCatalogClient } from '@/components/resources/resource-catalog-client'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  equipment: <Package className="h-5 w-5" />,
  workstation: <Cpu className="h-5 w-5" />,
  kit: <Camera className="h-5 w-5" />,
  space: <DoorOpen className="h-5 w-5" />,
}

export default async function ResourcesPage() {
  const supabase = await createClient()

  const { data: resources } = await supabase
    .from('resources')
    .select('*, owner:profiles!resources_owner_id_fkey(full_name), organization:organizations(name), requirements:resource_requirements(*)')
    .eq('is_active', true)
    .order('name')

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resource Catalog</h1>
        <p className="text-gray-500 mt-1">Browse available labs, equipment, and spaces</p>
      </div>

      <ResourceCatalogClient resources={resources ?? []} userId={user?.id} />
    </div>
  )
}
