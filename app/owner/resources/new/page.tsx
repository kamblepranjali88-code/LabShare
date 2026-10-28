'use client'
import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Package } from 'lucide-react'

const requirementSchema = z.object({
  type: z.enum(['training', 'membership', 'document', 'approval']),
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  is_mandatory: z.boolean().default(true),
})

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['equipment', 'space', 'kit', 'workstation']),
  location: z.string().min(2, 'Location required'),
  weekly_hour_cap: z.coerce.number().min(1).max(168),
  max_booking_duration_hours: z.coerce.number().min(0.5).max(72),
  min_notice_hours: z.coerce.number().min(0).max(168),
  advance_booking_days: z.coerce.number().min(1).max(90),
  requires_approval: z.boolean().default(true),
  tags: z.string().optional(),
  requirements: z.array(requirementSchema).optional(),
})
type FormData = z.infer<typeof schema>

export default function NewResourcePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'equipment',
      weekly_hour_cap: 20,
      max_booking_duration_hours: 4,
      min_notice_hours: 2,
      advance_booking_days: 14,
      requires_approval: true,
      requirements: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'requirements' })

  async function onSubmit(values: FormData) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()

      const tags = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : []

      const { data: resource, error } = await supabase
        .from('resources')
        .insert({
          owner_id: user.id,
          org_id: profile?.org_id,
          name: values.name,
          description: values.description,
          category: values.category,
          location: values.location,
          weekly_hour_cap: values.weekly_hour_cap,
          max_booking_duration_hours: values.max_booking_duration_hours,
          min_notice_hours: values.min_notice_hours,
          advance_booking_days: values.advance_booking_days,
          requires_approval: values.requires_approval,
          tags,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Insert requirements
      if (values.requirements && values.requirements.length > 0) {
        const reqs = values.requirements.map(r => ({
          resource_id: resource.id,
          type: r.type,
          name: r.name,
          description: r.description ?? '',
          is_mandatory: r.is_mandatory,
        }))
        const { error: reqErr } = await supabase.from('resource_requirements').insert(reqs)
        if (reqErr) throw reqErr
      }

      toast.success('Resource created successfully!')
      router.push('/owner/resources')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create resource')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Resource</h1>
        <p className="text-gray-500 text-sm mt-1">List a lab, equipment or space for booking</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" /> Basic Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name *</label>
            <input {...register('name')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 3D Printer (Ultimaker S5)"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea {...register('description')} rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe the resource, its capabilities and any important notes..."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="equipment">Equipment</option>
                <option value="space">Space</option>
                <option value="kit">Kit</option>
                <option value="workstation">Workstation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input {...register('location')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Lab 204, Block B"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input {...register('tags')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. printing, fabrication, CAD"
            />
          </div>
        </div>

        {/* Booking Rules */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Booking Rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Hour Cap</label>
              <input {...register('weekly_hour_cap')} type="number" min={1} max={168}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.weekly_hour_cap && <p className="text-red-500 text-xs mt-1">{errors.weekly_hour_cap.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Booking Duration (hours)</label>
              <input {...register('max_booking_duration_hours')} type="number" min={0.5} step={0.5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.max_booking_duration_hours && <p className="text-red-500 text-xs mt-1">{errors.max_booking_duration_hours.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Notice (hours)</label>
              <input {...register('min_notice_hours')} type="number" min={0}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance Booking (days)</label>
              <input {...register('advance_booking_days')} type="number" min={1}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input {...register('requires_approval')} type="checkbox" id="requires_approval"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="requires_approval" className="text-sm text-gray-700">Requires manager approval before booking is confirmed</label>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Eligibility Requirements</h2>
            <button
              type="button"
              onClick={() => append({ type: 'training', name: '', description: '', is_mandatory: true })}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Add Requirement
            </button>
          </div>
          {fields.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No requirements — anyone can book</p>
          )}
          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-100 rounded-lg p-4 space-y-3 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Requirement {index + 1}</p>
                <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select {...register(`requirements.${index}.type`)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="training">Training</option>
                    <option value="membership">Membership</option>
                    <option value="document">Document</option>
                    <option value="approval">Approval</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input {...register(`requirements.${index}.name`)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Laser Safety Certificate"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                <input {...register(`requirements.${index}.description`)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Instructions or details..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input {...register(`requirements.${index}.is_mandatory`)} type="checkbox" id={`req-mandatory-${index}`}
                  className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor={`req-mandatory-${index}`} className="text-xs text-gray-600">Mandatory (blocks booking if not met)</label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating…' : 'Create Resource'}
          </button>
        </div>
      </form>
    </div>
  )
}
