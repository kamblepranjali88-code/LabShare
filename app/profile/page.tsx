'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, Building2, Phone, FileText, Save } from 'lucide-react'
import type { Profile } from '@/types/database'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().nullable(),
  phone: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*, organization:organizations(*)')
        .eq('id', user.id)
        .single()
      if (data) {
        setProfile(data as Profile)
        reset({ full_name: data.full_name, bio: data.bio, phone: data.phone })
      }
      setLoading(false)
    }
    load()
  }, [reset])

  async function onSubmit(values: FormData) {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: values.full_name, bio: values.bio ?? null, phone: values.phone ?? null })
      .eq('id', user.id)
    if (error) {
      toast.error('Failed to save: ' + error.message)
    } else {
      toast.success('Profile updated!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details and information</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">{profile?.full_name}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{profile?.role}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Building2 className="h-6 w-6 text-green-600" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">{profile?.organization?.name ?? 'No org'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Organization</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
            profile?.verified_status === 'verified' ? 'bg-green-100' :
            profile?.verified_status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
          }`}>
            <span className="text-lg">
              {profile?.verified_status === 'verified' ? '✅' :
               profile?.verified_status === 'rejected' ? '❌' : '⏳'}
            </span>
          </div>
          <p className="font-semibold text-gray-900 text-sm capitalize">{profile?.verified_status}</p>
          <p className="text-xs text-gray-400 mt-0.5">Account Status</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Edit Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-3.5 w-3.5 inline mr-1" /> Full Name
            </label>
            <input
              {...register('full_name')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="h-3.5 w-3.5 inline mr-1" /> Phone (optional)
            </label>
            <input
              {...register('phone')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+1 555 000 0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-3.5 w-3.5 inline mr-1" /> Bio (optional)
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us a bit about yourself..."
            />
            {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Read-only info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account Information</h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 font-medium">{profile?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Role</dt>
            <dd className="capitalize text-gray-900 font-medium">{profile?.role}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Active Bookings</dt>
            <dd className="text-gray-900 font-medium">{profile?.active_bookings_count ?? 0}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">No-shows</dt>
            <dd className="text-gray-900 font-medium">{profile?.noshow_count ?? 0}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Member since</dt>
            <dd className="text-gray-900 font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
