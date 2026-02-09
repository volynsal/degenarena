'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Radio, Shield, LayoutDashboard, Orbit } from 'lucide-react'

const navItems = [
  { name: 'Live', href: '/live', icon: Radio },
  { name: 'Clans', href: '/clans', icon: Shield },
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard, center: true },
  { name: 'Arena', href: '/arena-bets', icon: Orbit },
  // Profile is handled separately (needs dynamic href + avatar)
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const profileHref = `/u/${username}`
  const isProfileActive = pathname.startsWith('/u/')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      {/* Blur backdrop */}
      <div className="bg-arena-darker/90 backdrop-blur-xl border-t border-white/10">
        <div className="flex items-end justify-around px-2 pt-2 pb-2 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            if (item.center) {
              // Center "Home" button — stylized
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 -mt-3"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150',
                      isActive
                        ? 'bg-gradient-to-br from-arena-purple to-arena-cyan shadow-lg shadow-arena-purple/25'
                        : 'bg-white/10'
                    )}
                  >
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} className="text-white" />
                  </div>
                  <span className={cn(
                    'text-[10px] mt-0.5',
                    isActive ? 'text-white font-semibold' : 'text-gray-500'
                  )}>
                    {item.name}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={cn(
                    'transition-colors duration-150',
                    isActive ? 'text-white' : 'text-gray-500'
                  )}
                />
                <span className={cn(
                  'text-[10px]',
                  isActive ? 'text-white font-semibold' : 'text-gray-500'
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* Profile — avatar initial */}
          <Link
            href={profileHref}
            className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
          >
            <div
              className={cn(
                'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-150',
                isProfileActive
                  ? 'bg-gradient-to-br from-arena-purple to-arena-cyan text-white ring-2 ring-white'
                  : 'bg-white/10 text-gray-400'
              )}
            >
              {username.charAt(0).toUpperCase()}
            </div>
            <span className={cn(
              'text-[10px]',
              isProfileActive ? 'text-white font-semibold' : 'text-gray-500'
            )}>
              Profile
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
