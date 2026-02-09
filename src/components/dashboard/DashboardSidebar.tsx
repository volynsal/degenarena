'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUserXp } from '@/lib/hooks/use-competitions'
import { TIER_COLORS, TIER_LABELS, type TierName } from '@/types/database'
import { 
  LayoutDashboard, 
  Sliders, 
  Trophy, 
  Shield,
  Settings,
  Swords,
  Radio,
  Orbit,
  MessageSquare
} from 'lucide-react'

const navigation = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Galaxy', href: '/arena-bets', icon: Orbit },
  { name: 'Live', href: '/live', icon: Radio },
  { name: 'Clans', href: '/clans', icon: Shield },
  { name: 'Competitions', href: '/competitions', icon: Swords },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'My Formulas', href: '/formulas', icon: Sliders },
]

const bottomNavigation = [
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { xp, progress } = useUserXp()
  
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 z-20 bg-arena-darker border-r border-white/5 hidden lg:block">
      <div className="flex flex-col h-full px-3 py-6">
        {/* Main navigation */}
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl text-base transition-all duration-150',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-gray-400 font-normal hover:text-white hover:bg-white/[0.03]'
                )}
              >
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="flex-shrink-0"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Tier / XP Card */}
        {xp && progress && (
          <div className="mb-4 mx-1 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase',
                TIER_COLORS[xp.tier as TierName]
              )}>
                {TIER_LABELS[xp.tier as TierName]}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {progress.xp_current} XP
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            {progress.next_tier && (
              <p className="text-[10px] text-gray-600 mt-1">
                {progress.xp_for_next! - progress.xp_current} XP to {TIER_LABELS[progress.next_tier as TierName]}
              </p>
            )}
          </div>
        )}
        
        {/* Bottom navigation */}
        <nav className="space-y-0.5 pt-4 border-t border-white/5">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-xl text-base transition-all duration-150',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-gray-400 font-normal hover:text-white hover:bg-white/[0.03]'
                )}
              >
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="flex-shrink-0"
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
