
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { FlaskConical } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)

    try {
      const supabase = createClient()

      const { data: authData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password: data.password,
        })

      if (error) {
        console.error('Supabase login error:', error.message)
        toast.error(error.message)
        return
      }

      if (!authData.user) {
        toast.error('Login failed. Please try again.')
        return
      }

      console.log('Authentication successful:', authData.user.id)
      toast.success('Signed in successfully!')

      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Unexpected login error:', error)
      toast.error('Unable to sign in. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <FlaskConical className="h-7 w-7 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">LabShare</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Sign in to access shared labs and equipment
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-xs border border-blue-100">
          <p className="font-semibold text-blue-900 mb-2">
            🔑 Demo Credentials
          </p>
          <div className="space-y-1 text-blue-700 font-mono">
            <p>Admin: admin@apex.edu / Password123!</p>
            <p>Owner: owner1@apex.edu / Password123!</p>
            <p>Manager: manager@apex.edu / Password123!</p>
            <p>User: alice@apex.edu / Password123!</p>
            <p>Startup: startup@nexalab.io / Password123!</p>
          </div>
          <p className="mt-2 text-gray-600">
            Demo accounts must be created in Supabase before they can be used.
          </p>
        </div>
      </div>
    </div>
  )
}
