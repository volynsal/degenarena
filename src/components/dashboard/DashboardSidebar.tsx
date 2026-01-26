'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Sliders, 
  Bell, 
  Trophy, 
  BarChart3,
  Settings,
  Users,
  Sparkles
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Formulas', href: '/formulas', icon: Sliders },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Community', href: '/community', icon: Users },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-arena-darker border-r border-white/5 hidden lg:block">
      <div className="flex flex-col h-full p-4">
        {/* Main navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-arena-purple/20 to-arena-cyan/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={18} className={isActive ? 'text-arena-cyan' : ''} />
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        {/* Upgrade card */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-arena-purple/20 to-arena-cyan/10 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-arena-cyan" />
            <span className="text-sm font-medium text-white">Go Pro</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Unlimited formulas, instant alerts, and priority support.
          </p>
          <Link
            href="/pricing"
            className="block text-center py-2 px-3 rounded-lg bg-gradient-to-r from-arena-purple to-arena-cyan text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade
          </Link>
        </div>
        
        {/* Bottom navigation */}
        <nav className="space-y-1 pt-4 border-t border-white/5">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
