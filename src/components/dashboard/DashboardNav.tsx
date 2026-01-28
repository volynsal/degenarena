'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Settings, User, Menu, LogOut, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

export function DashboardNav() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }
  
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-arena-darker/90 backdrop-blur-xl border-b border-white/5 h-14">
      <div className="h-full px-4 lg:px-8 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1.5 text-gray-400 hover:text-white">
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="DegenArena HQ" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold gradient-text hidden sm:block">DegenArena HQ</span>
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
                  href="/settings" 
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
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
  )
}
