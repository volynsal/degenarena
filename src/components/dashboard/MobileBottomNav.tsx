'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/stores/auth-store'
import {
  Radio, Shield, LayoutDashboard, Orbit, Menu,
  Swords, Trophy, Sliders, MessageSquare, Settings,
  ChevronRight, LogOut, X
} from 'lucide-react'

const navItems = [
  { name: 'Live', href: '/live', icon: Radio },
  { name: 'Clans', href: '/clans', icon: Shield },
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard, center: true },
  { name: 'Arena', href: '/arena-bets', icon: Orbit },
]

const moreItems = [
  { name: 'Competitions', href: '/competitions', icon: Swords },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'My Formulas', href: '/formulas', icon: Sliders },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  const profileHref = `/u/${username}`

  // Close sheet on route change
  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sheetOpen])

  const handleSignOut = useCallback(async () => {
    setSheetOpen(false)
    await signOut()
    router.push('/')
    router.refresh()
  }, [signOut, router])

  const isMoreActive = sheetOpen ||
    moreItems.some((item) => pathname === item.href) ||
    pathname.startsWith('/u/')

  return (
    <>
      {/* Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="bg-arena-darker/95 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-around px-2 pt-1.5 pb-1.5 pb-safe">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              if (item.center) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center gap-0.5"
                    onClick={() => setSheetOpen(false)}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
                        isActive
                          ? 'bg-gradient-to-br from-arena-purple to-arena-cyan shadow-lg shadow-arena-purple/25'
                          : 'bg-white/[0.06]'
                      )}
                    >
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} className="text-white" />
                    </div>
                    <span className={cn(
                      'text-[10px]',
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
                  className="flex flex-col items-center gap-1 min-w-[48px] py-0.5"
                  onClick={() => setSheetOpen(false)}
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

            {/* More button */}
            <button
              onClick={() => setSheetOpen((prev) => !prev)}
              className="flex flex-col items-center gap-1 min-w-[48px] py-0.5"
            >
              {sheetOpen ? (
                <X
                  size={22}
                  strokeWidth={2}
                  className="text-white transition-colors duration-150"
                />
              ) : (
                <Menu
                  size={22}
                  strokeWidth={isMoreActive && !sheetOpen ? 2.5 : 1.5}
                  className={cn(
                    'transition-colors duration-150',
                    isMoreActive ? 'text-white' : 'text-gray-500'
                  )}
                />
              )}
              <span className={cn(
                'text-[10px]',
                isMoreActive ? 'text-white font-semibold' : 'text-gray-500'
              )}>
                More
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Centered modal overlay */}
      {sheetOpen && (
        <div className="fixed inset-0 z-30 lg:hidden flex items-center justify-center px-6">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSheetOpen(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-sm rounded-2xl bg-arena-dark/95 border border-white/10 overflow-hidden shadow-2xl">
            {/* Profile row */}
            <Link
              href={profileHref}
              className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
              onClick={() => setSheetOpen(false)}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">@{username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 flex-shrink-0" />
            </Link>

            {/* Nav items */}
            <div className="py-1">
              {moreItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3.5 px-5 py-3.5 transition-colors',
                      isActive
                        ? 'text-white bg-white/[0.05]'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                    )}
                    onClick={() => setSheetOpen(false)}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2 : 1.5} className="flex-shrink-0" />
                    <span className={cn('text-sm', isActive && 'font-medium')}>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Sign out */}
            <div className="border-t border-white/[0.06]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-red-400 hover:text-red-300 hover:bg-white/[0.03] transition-colors"
              >
                <LogOut size={20} strokeWidth={1.5} />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
