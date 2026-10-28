'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FlaskConical,
  LayoutDashboard,
  Package,
  CalendarCheck,
  Award,
  Bell,
  Settings,
  ShieldCheck,
  FileText,
  Users,
  ClipboardList,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, roles: ['user', 'owner', 'manager', 'admin'] },
  { href: '/resources', label: 'Resources', icon: <Package className="h-4 w-4" />, roles: ['user', 'owner', 'manager', 'admin'] },
  { href: '/bookings', label: 'My Bookings', icon: <CalendarCheck className="h-4 w-4" />, roles: ['user', 'owner', 'manager', 'admin'] },
  { href: '/credentials', label: 'Credentials', icon: <Award className="h-4 w-4" />, roles: ['user', 'owner', 'manager', 'admin'] },
  { href: '/notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, roles: ['user', 'owner', 'manager', 'admin'] },
  // Owner / Manager
  { href: '/owner', label: 'Owner Dashboard', icon: <ClipboardList className="h-4 w-4" />, roles: ['owner', 'manager', 'admin'] },
  { href: '/owner/requests', label: 'Requests Queue', icon: <FileText className="h-4 w-4" />, roles: ['owner', 'manager', 'admin'] },
  { href: '/owner/resources', label: 'My Resources', icon: <Settings className="h-4 w-4" />, roles: ['owner', 'manager', 'admin'] },
  // Admin
  { href: '/admin', label: 'Admin Panel', icon: <ShieldCheck className="h-4 w-4" />, roles: ['admin'] },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" />, roles: ['admin'] },
  { href: '/admin/audit', label: 'Audit Log', icon: <Activity className="h-4 w-4" />, roles: ['admin'] },
]

export function SidebarNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const role = profile?.role ?? 'user'

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-gray-100">
        <FlaskConical className="h-6 w-6 text-blue-600" />
        <span className="font-bold text-gray-900">LabShare</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info at bottom */}
      {profile && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
              {profile.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-400 capitalize">{profile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
