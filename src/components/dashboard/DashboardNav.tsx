'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Settings, User, Menu, LogOut, ChevronDown, X, LayoutDashboard, Sliders, Swords, Shield, Trophy, Radio, Orbit } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { cn } from '@/lib/utils'

const mobileNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Galaxy Arena', href: '/arena-bets', icon: Orbit },
  { name: 'My Formulas', href: '/formulas', icon: Sliders },
  { name: 'Competitions', href: '/competitions', icon: Swords },
  { name: 'Clans', href: '/clans', icon: Shield },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Live', href: '/live', icon: Radio },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function DashboardNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }
  
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-arena-darker/90 backdrop-blur-xl border-b border-white/5 h-14">
        <div className="h-full px-4 lg:px-8 flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 text-gray-400 hover:text-white"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="DegenArena HQ" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-bold gradient-text font-brand hidden sm:block">DegenArena HQ</span>
            </Link>
          </div>
        
        {/* Right side */}
        <div className="flex items-center gap-1">
          <Link 
            href="/settings" 
            className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Alert Settings"
          >
            <Bell size={18} />
          </Link>
          <Link 
            href="/settings"
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <Settings size={18} />
          </Link>
          
          {/* User menu */}
          <div className="ml-1.5 pl-1.5 border-l border-white/10 relative" ref={menuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-white text-sm font-medium hidden sm:block">
                {username}
              </span>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </button>
            
            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-arena-dark border border-white/10 rounded-lg shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm text-white font-medium truncate">{username}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link 
                  href={`/u/${username}`}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-transparent hover:bg-gradient-to-r hover:from-arena-purple hover:to-arena-cyan hover:bg-clip-text transition-all cursor-pointer group"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} className="group-hover:text-arena-purple transition-colors" />
                  View Profile
                </Link>
                <Link 
                  href="/settings" 
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    
    {/* Mobile Menu Overlay */}
    {showMobileMenu && (
      <div className="fixed inset-0 z-40 lg:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMobileMenu(false)}
        />
        
        {/* Menu Panel */}
        <div className="absolute left-0 top-14 bottom-0 w-72 bg-arena-darker border-r border-white/10 overflow-y-auto">
          <div className="p-4 space-y-1">
            {mobileNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-arena-purple/20 to-arena-cyan/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon size={20} className={isActive ? 'text-arena-cyan' : ''} />
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          {/* User section at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-arena-darker">
            <Link 
              href={`/u/${username}`}
              className="flex items-center gap-3 mb-3 p-2 -m-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-white font-medium">{username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
