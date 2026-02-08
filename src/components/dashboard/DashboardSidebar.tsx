'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Sliders, 
  Trophy, 
  Users,
  Shield,
  Settings,
  Sparkles,
  Swords,
  Radio,
  Orbit
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Galaxy Arena', href: '/arena-bets', icon: Orbit },
  { name: 'My Formulas', href: '/formulas', icon: Sliders },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Competitions', href: '/competitions', icon: Swords },
  { name: 'Clans', href: '/clans', icon: Shield },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Live', href: '/live', icon: Radio },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Tile colors matching the brand
const TILE_COLORS = [
  [168, 85, 247],  // purple
  [6, 182, 212],   // cyan
  [139, 92, 246],  // purple-lighter
  [34, 211, 238],  // cyan-lighter
]

interface MiniTile {
  brightness: number
  target: number
  color: number[]
  speed: number
}

function SidebarTiles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const tileSize = 28
    const gap = 2
    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let tiles: MiniTile[] = []

    const initGrid = () => {
      const rect = container.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = width
      canvas.height = height
      cols = Math.ceil(width / (tileSize + gap)) + 1
      rows = Math.ceil(height / (tileSize + gap)) + 1

      const newTiles: MiniTile[] = []
      for (let i = 0; i < cols * rows; i++) {
        newTiles.push(tiles[i] || {
          brightness: 0,
          target: 0,
          color: TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)],
          speed: 0.008 + Math.random() * 0.012,
        })
      }
      tiles = newTiles
    }

    initGrid()

    const ro = new ResizeObserver(initGrid)
    ro.observe(container)

    let lastSpawn = 0
    let animId = 0

    const loop = (now: number) => {
      ctx.fillStyle = '#0a0a0b'
      ctx.fillRect(0, 0, width, height)

      // Spawn a tile every ~150ms
      if (now - lastSpawn > 150) {
        lastSpawn = now
        const idx = Math.floor(Math.random() * tiles.length)
        tiles[idx].target = 0.3 + Math.random() * 0.5
        tiles[idx].color = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)]
        tiles[idx].speed = 0.006 + Math.random() * 0.01
      }

      // Faint grid lines
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.03)'
      ctx.lineWidth = 1
      for (let c = 0; c <= cols; c++) {
        const x = c * (tileSize + gap)
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let r = 0; r <= rows; r++) {
        const y = r * (tileSize + gap)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          const tile = tiles[idx]
          if (!tile) continue

          if (tile.brightness < tile.target) {
            tile.brightness = Math.min(tile.target, tile.brightness + tile.speed * 3)
          } else {
            tile.brightness = Math.max(0, tile.brightness - tile.speed)
          }

          if (Math.abs(tile.brightness - tile.target) < 0.01 && tile.target > 0) {
            tile.target = 0
          }

          if (tile.brightness < 0.005) continue

          const x = c * (tileSize + gap) + gap
          const y = r * (tileSize + gap) + gap
          const [cr, cg, cb] = tile.color
          const a = tile.brightness

          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.12})`
          ctx.fillRect(x, y, tileSize - gap, tileSize - gap)

          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.3})`
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, tileSize - gap, tileSize - gap)

          if (a > 0.5) {
            ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.1})`
            ctx.shadowBlur = 10
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.06})`
            ctx.fillRect(x, y, tileSize - gap, tileSize - gap)
            ctx.shadowBlur = 0
          }
        }
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <div ref={containerRef} className="flex-1 min-h-0 relative overflow-hidden rounded-lg my-2">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 z-20 bg-arena-darker border-r border-white/5 hidden lg:block">
      <div className="flex flex-col h-full p-4">
        {/* Main navigation */}
        <nav className="space-y-1">
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

        {/* Tron tiles fill the dead space */}
        <SidebarTiles />
        
        {/* Upgrade card - coming soon */}
        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-arena-purple/20 to-arena-cyan/10 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-arena-cyan" />
            <span className="text-sm font-medium text-white">Pro Coming Soon</span>
          </div>
          <p className="text-xs text-gray-400">
            Unlimited formulas, instant alerts, and priority support.
          </p>
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
