import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from 'sonner'

// Lazy-load heavy client-only effects (ssr: false)
const Sparkles = dynamic(() => import('@/components/effects/Sparkles').then(m => ({ default: m.Sparkles })), { ssr: false })
const Cursor = dynamic(() => import('@/components/effects/Cursor').then(m => ({ default: m.Cursor })), { ssr: false })
const ScrollProgress = dynamic(() => import('@/components/effects/ScrollProgress').then(m => ({ default: m.ScrollProgress })), { ssr: false })
const SmoothScroll = dynamic(() => import('@/components/effects/SmoothScroll').then(m => ({ default: m.SmoothScroll })), { ssr: false })
const Preloader = dynamic(() => import('@/components/effects/Preloader').then(m => ({ default: m.Preloader })), { ssr: false })

export const metadata: Metadata = {
  title: 'LabShare – Resource Sharing Platform',
  description: 'A trusted resource-sharing platform for labs, makerspaces, and colleges.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Preloader />
        <Sparkles density={55} />
        <Cursor />
        <ScrollProgress />
        <QueryProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  )
}
