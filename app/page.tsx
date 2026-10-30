import dynamic from 'next/dynamic'
import Link from 'next/link'
import { FlaskConical, Shield, Clock, Award, Users, Zap, CheckCircle, ArrowRight, Star } from 'lucide-react'
import Marquee from 'react-fast-marquee'

const AnimatedHeadline = dynamic(() => import('@/components/effects/AnimatedHeadline').then(m => ({ default: m.AnimatedHeadline })), { ssr: false })
const DotGrid = dynamic(() => import('@/components/effects/DotGrid').then(m => ({ default: m.DotGrid })), { ssr: false })
const SpotlightCard = dynamic(() => import('@/components/effects/SpotlightCard').then(m => ({ default: m.SpotlightCard })), { ssr: false })

const TICKER_ITEMS = [
  '🔬 Lab Equipment', '🎥 DSLR Cameras', '🖨 3D Printers', '💡 Laser Cutters',
  '💻 GPU Workstations', '🛠 Makerspaces', '🏛 Seminar Rooms', '📡 Oscilloscopes',
  '🔭 Research Labs', '🎨 Design Studios',
]

const FEATURES = [
  { icon: Shield, title: 'Trust-First', desc: 'Every action audited. Eligibility checks before any booking. Owners always in control.', color: 'text-blue-400' },
  { icon: Clock, title: 'Fair Allocation', desc: '6-hour weekly caps, max 2 bookings, FIFO waitlist with visible priority score.', color: 'text-cyan-400' },
  { icon: Award, title: 'Credential Verified', desc: 'Safety training, membership docs — all verified before access to sensitive equipment.', color: 'text-violet-400' },
  { icon: Users, title: 'Role Hierarchy', desc: 'User → Owner → Manager → Admin. Each role sees exactly what they need.', color: 'text-amber-400' },
  { icon: Zap, title: 'Instant Check-In', desc: 'QR-based check-in with before/after condition photos. Zero paper, full trail.', color: 'text-green-400' },
  { icon: CheckCircle, title: 'Append-Only Audit', desc: 'Every decision — approve, reject, waitlist — logged forever with mandatory reasons.', color: 'text-pink-400' },
]

const RESOURCES = [
  { name: '3D Printer', category: 'Equipment', location: 'Lab 204, Block B', tags: ['fabrication', 'printing'], bookings: 47 },
  { name: 'Laser Cutter', category: 'Equipment', location: 'Fabrication Lab', tags: ['safety-training'], bookings: 32 },
  { name: 'Oscilloscope Kit', category: 'Kit', location: 'Electronics Lab', tags: ['electronics'], bookings: 28 },
  { name: 'DSLR Camera Kit', category: 'Kit', location: 'Media Room', tags: ['photography'], bookings: 61 },
  { name: 'GPU Workstation', category: 'Workstation', location: 'Server Room A', tags: ['ML', 'AI'], bookings: 53 },
  { name: 'Seminar Room A', category: 'Space', location: 'Main Block', tags: ['presentation'], bookings: 89 },
]

const STEPS = [
  { n: '01', title: 'Browse Resources', desc: 'Search labs and equipment by category, location, and availability.' },
  { n: '02', title: 'Check Eligibility', desc: 'The system verifies your credentials and shows exactly what you need.' },
  { n: '03', title: 'Request & Approve', desc: 'Owners review with full context. Every decision gets a mandatory reason.' },
  { n: '04', title: 'Check In & Return', desc: 'QR scan, before/after photos, full condition record — automated.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">

      {/* ──── HERO ──── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <div className="aurora" aria-hidden />
        <DotGrid gap={36} dotSize={1.5} influence={130} />

        {/* Nav */}
        <nav className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-5 z-10">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-white text-lg">LabShare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors shadow-[0_0_20px_rgba(79,124,255,0.4)]"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Badge */}
        <div className="relative z-10 mb-6 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-current" />
          Code Hack India 2026 · Bharti Vidyapeeth Deemed To Be University College Of Engineering ,Pune College Demo
        </div>

        {/* Headline */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <AnimatedHeadline
            text="Share Smarter. Waste Less."
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-blue-200 to-violet-300 bg-clip-text text-transparent pb-2"
          />
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A trust-first platform that connects engineering colleges, labs and makerspaces with
            students and startups who need access to underused equipment.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(79,124,255,0.5)] hover:shadow-[0_0_40px_rgba(79,124,255,0.7)] hover:-translate-y-0.5"
            >
              Request Access
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-8 py-3.5 rounded-2xl transition-all duration-300 backdrop-blur-sm hover:-translate-y-0.5"
            >
              <FlaskConical className="h-4 w-4 text-blue-400" />
              View Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { n: '6+', label: 'Resources Listed' },
              { n: '9', label: 'Demo Accounts' },
              { n: '100%', label: 'Audit Logged' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-white">{s.n}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ──── TICKER ──── */}
      <div className="border-y border-white/5 py-4 bg-white/[0.02]">
        <Marquee gradient={false} speed={35} pauseOnHover>
          {TICKER_ITEMS.map((t) => (
            <span key={t} className="mx-10 text-sm text-gray-500 font-medium">{t}</span>
          ))}
        </Marquee>
      </div>

      {/* ──── FEATURES BENTO ──── */}
      <section className="py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-sm font-medium tracking-widest uppercase mb-3">Platform Features</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Built for institutional trust</h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">Every feature designed around accountability, fairness and transparency.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <SpotlightCard key={f.title} className="p-6 card-hover">
              <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ──── RESOURCES PREVIEW ──── */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-3">Live Resources</p>
          <h2 className="text-4xl font-bold text-white">Available at Bharti Engineering College</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESOURCES.map((r) => (
            <SpotlightCard key={r.name} className="p-5 card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-violet-600/20 flex items-center justify-center">
                  <FlaskConical className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-xs bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-gray-400">
                  {r.category}
                </span>
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{r.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{r.location}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {r.tags.map(t => (
                    <span key={t} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">{r.bookings} bookings</span>
              </div>
            </SpotlightCard>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
          >
            Browse all resources <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section className="py-20 px-4 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-sm font-medium tracking-widest uppercase mb-3">Workflow</p>
            <h2 className="text-4xl font-bold text-white">From request to return in 4 steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-1rem)] w-8 h-px bg-gradient-to-r from-gray-700 to-transparent z-10" />
                )}
                <SpotlightCard className="p-5 h-full card-hover">
                  <div className="text-4xl font-black text-gradient-brand mb-3">{s.n}</div>
                  <h3 className="font-semibold text-white mb-2 text-sm">{s.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="py-32 px-4 text-center relative overflow-hidden">
        <div className="aurora" aria-hidden />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Ready to share smarter?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join Bharti Engineering College&apos;s trusted resource-sharing network.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold px-10 py-4 rounded-2xl transition-all shadow-[0_0_40px_rgba(79,124,255,0.5)] hover:shadow-[0_0_60px_rgba(79,124,255,0.7)] hover:-translate-y-1 text-lg"
            >
              Get Started Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-10 inline-block bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-left backdrop-blur-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">🔑 Demo credentials (all use Password123!)</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-gray-400">
              <span>admin@apex.edu</span><span className="text-gray-600">Admin</span>
              <span>owner1@apex.edu</span><span className="text-gray-600">Owner</span>
              <span>manager@apex.edu</span><span className="text-gray-600">Manager</span>
              <span>alice@apex.edu</span><span className="text-gray-600">User</span>
              <span>startup@nexalab.io</span><span className="text-gray-600">Startup</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <FlaskConical className="h-4 w-4 text-blue-400" />
            <span>LabShare</span>
            <span className="text-gray-700">·</span>
            <span>Code Hack India 2026</span>
          </div>
          <p className="text-xs text-gray-700">
            Built with Next.js · Supabase · Tailwind · GSAP · Fictional data only
          </p>
        </div>
      </footer>
    </div>
  )
}
