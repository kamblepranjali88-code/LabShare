'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Package, Plus, ToggleLeft, ToggleRight, Edit } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function OwnerResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resources')
      .select('*, requirements:resource_requirements(id)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setResources(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from('resources').update({ is_active: !current }).eq('id', id)
    if (error) { toast.error('Failed to update: ' + error.message); return }
    toast.success(`Resource ${!current ? 'activated' : 'deactivated'}`)
    setResources(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Resources</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the labs and equipment you own</p>
        </div>
        <Link
          href="/owner/resources/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Resource
        </Link>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">You haven&apos;t listed any resources yet</p>
          <Link href="/owner/resources/new" className="text-sm text-blue-600 hover:underline">
            + Add your first resource
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {r.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{r.location} · {r.category}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {r.requirements?.length ?? 0} requirements · Max {r.max_booking_duration_hours}h · {r.weekly_hour_cap}h/week cap
                </p>
                <p className="text-xs text-gray-400">Added {formatDate(r.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/resources/${r.id}`}
                  className="text-xs text-blue-600 hover:underline px-2 py-1"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={() => toggleActive(r.id, r.is_active)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title={r.is_active ? 'Deactivate' : 'Activate'}
                >
                  {r.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
