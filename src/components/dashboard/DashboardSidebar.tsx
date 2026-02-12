'use client'

import { useState } from 'react'
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
  const [expanded, setExpanded] = useState(false)
  
  return (
    <aside
      className={cn(
        'fixed left-0 top-14 bottom-0 z-20 bg-arena-darker border-r border-white/5 hidden lg:block',
        'transition-[width] duration-300 ease-in-out overflow-hidden',
        expanded ? 'w-60' : 'w-[72px]'
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex flex-col h-full py-6 px-2">
        {/* Main navigation */}
        <nav className="flex-1 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-xl transition-all duration-150 h-12',
                  expanded ? 'gap-4 px-4' : 'justify-center px-0',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-gray-400 font-normal hover:text-white hover:bg-white/[0.03]'
                )}
                title={expanded ? undefined : item.name}
              >
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="flex-shrink-0"
                />
                <span
                  className={cn(
                    'text-base whitespace-nowrap transition-opacity duration-200',
                    expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Tier / XP Card — only visible when expanded */}
        {xp && progress && (
          <div
            className={cn(
              'mx-1 mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 transition-all duration-200',
              expanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden m-0 p-0 border-0'
            )}
          >
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
                  'flex items-center rounded-xl transition-all duration-150 h-11',
                  expanded ? 'gap-4 px-4' : 'justify-center px-0',
                  isActive
                    ? 'text-white font-bold'
                    : 'text-gray-400 font-normal hover:text-white hover:bg-white/[0.03]'
                )}
                title={expanded ? undefined : item.name}
              >
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className="flex-shrink-0"
                />
                <span
                  className={cn(
                    'text-base whitespace-nowrap transition-opacity duration-200',
                    expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
