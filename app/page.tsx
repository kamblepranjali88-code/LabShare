import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FlaskConical,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Users,
  Star,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName = ''
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    displayName = profile?.full_name || user.email?.split('@')[0] || 'Account'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LabShare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/resources" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Browse Resources
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Dashboard
                </Link>
                <span className="hidden sm:inline text-sm font-medium text-gray-900">{displayName}</span>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <Star className="h-3.5 w-3.5 fill-blue-600" />
            Trusted by 50+ institutions
          </div>
          <h1 className="text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Book the tools{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              your ideas need
            </span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            LabShare is a trusted resource-sharing platform for labs, makerspaces, and colleges.
            Share institutional equipment fairly, transparently, and with full accountability.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/resources"
              className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              Browse Resources
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={user ? '/dashboard' : '/login'}
              className="border border-gray-200 text-gray-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Sign In'}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '2,400+', label: 'Resources Listed' },
              { value: '180+', label: 'Partner Institutions' },
              { value: '94%', label: 'Fair Allocation Rate' },
              { value: '12,000+', label: 'Bookings This Month' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-extrabold text-blue-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for fairness and trust</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Every feature is designed to make resource sharing transparent, equitable, and accountable.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
                title: 'Eligibility Engine',
                description:
                  'Automatically verify training certificates, safety documents, and institutional affiliations before allowing bookings. No more manual gatekeeping.',
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
                title: 'Fair Allocation',
                description:
                  'Dynamic priority scoring with per-resource weekly hour caps, cooldown periods, and waitlisting ensures no single user monopolizes shared equipment.',
              },
              {
                icon: <ClipboardCheck className="h-6 w-6 text-violet-600" />,
                title: 'Full Audit Trail',
                description:
                  'Every action — booking, approval, check-in, condition report, incident — is immutably logged with actor, timestamp, and reason for complete accountability.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-500">From request to return — fully managed.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Verify Eligibility',
                description: 'Upload your training certificates and documents. Our engine checks compliance automatically.',
              },
              {
                step: '02',
                title: 'Browse & Book',
                description: 'Find available resources, check the calendar, and submit a booking request with your purpose.',
              },
              {
                step: '03',
                title: 'Get Approved',
                description: "Lab managers review requests, considering fair-use scores and competing bookings. You're notified instantly.",
              },
              {
                step: '04',
                title: 'Check In & Return',
                description: 'Scan the QR code to check in. Log equipment condition on return. Incidents are handled automatically.',
              },
            ].map((item, i) => (
              <div key={item.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200 z-0" />
                )}
                <div className="bg-white rounded-2xl p-6 shadow-sm relative z-10">
                  <div className="text-5xl font-black text-blue-100 mb-4">{item.step}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="h-12 w-12 text-blue-600 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to share smarter?</h2>
          <p className="text-lg text-gray-500 mb-8">
            Join hundreds of institutions already using LabShare to manage their equipment fairly and efficiently.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={user ? '/dashboard' : '/signup'}
              className="bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              {user ? 'Go to Dashboard' : 'Get started free'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/resources"
              className="text-gray-600 font-medium hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              Browse resources <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-gray-900">LabShare</span>
            <span className="text-gray-400 text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/resources" className="hover:text-gray-900 transition-colors">Resources</Link>
            {user ? (
              <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-gray-900 transition-colors">Sign In</Link>
                <Link href="/signup" className="hover:text-gray-900 transition-colors">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}