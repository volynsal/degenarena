'use client'

import { useEffect, useRef } from 'react'

// =============================================
// VIDEO BACKGROUND (landing page / waitlist)
// Native <video> element — reliable autoplay, no controls
// =============================================

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Force play after mount — handles browsers that block autoplay attribute
    const tryPlay = () => {
      if (video.paused) {
        video.muted = true
        video.play().catch(() => {})
      }
    }

    // Try immediately + staggered retries
    tryPlay()
    const t1 = setTimeout(tryPlay, 300)
    const t2 = setTimeout(tryPlay, 1000)
    const t3 = setTimeout(tryPlay, 3000)

    // Also try on any user interaction as a last resort
    const handleInteraction = () => {
      tryPlay()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)
    document.addEventListener('scroll', handleInteraction, { passive: true })

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        overflow: 'hidden',
        background: '#080808',
        pointerEvents: 'none',
      }}
    >
      {/* Hide Safari / WebKit native video controls & play button */}
      <style>{`
        .vid-bg::-webkit-media-controls,
        .vid-bg::-webkit-media-controls-panel,
        .vid-bg::-webkit-media-controls-play-button,
        .vid-bg::-webkit-media-controls-start-playback-button,
        .vid-bg::-webkit-media-controls-overlay-play-button {
          display: none !important;
          -webkit-appearance: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <video
        ref={videoRef}
        className="vid-bg"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          minWidth: '100%',
          minHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'cover',
        }}
      >
        <source
          src="/grok-video-246d9a09-191b-4cbf-ad90-1e78efe57863-2.mp4"
          type="video/mp4"
        />
      </video>
      {/* Dark overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.35) 40%, rgba(8,8,8,0.35) 60%, rgba(8,8,8,0.6) 100%)',
        }}
      />
    </div>
  )
}

// =============================================
// TRON GRID BACKGROUND (auth pages)
// Digital tiles that take turns lighting up
// =============================================

// Color palette: purple and cyan to match the brand
const TILE_COLORS = [
  [168, 85, 247],  // arena-purple
  [6, 182, 212],   // arena-cyan
  [139, 92, 246],  // purple-lighter
  [34, 211, 238],  // cyan-lighter
]

interface Tile {
  brightness: number   // 0 = dark, 1 = fully lit
  target: number       // target brightness (fading toward this)
  color: number[]      // [r, g, b]
  speed: number        // fade speed
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const isMobile = window.innerWidth < 768 ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Grid config
    const tileSize = isMobile ? 40 : 50
    const gap = 2

    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let tiles: Tile[] = []

    const initGrid = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      cols = Math.ceil(width / (tileSize + gap)) + 1
      rows = Math.ceil(height / (tileSize + gap)) + 1

      // Preserve existing tiles where possible, create new ones
      const newTiles: Tile[] = []
      for (let i = 0; i < cols * rows; i++) {
        newTiles.push(tiles[i] || {
          brightness: 0,
          target: 0,
          color: TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)],
          speed: 0.01 + Math.random() * 0.02,
        })
      }
      tiles = newTiles
    }

    initGrid()
    window.addEventListener('resize', initGrid)

    // Periodically light up random tiles
    let lastSpawn = 0
    const spawnInterval = isMobile ? 120 : 80 // ms between new tile activations

    let animId = 0

    const loop = (now: number) => {
      // Dark background
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, width, height)

      // Spawn new lit tiles
      if (now - lastSpawn > spawnInterval) {
        lastSpawn = now
        // Light up 1-3 random tiles
        const count = 1 + Math.floor(Math.random() * 2)
        for (let n = 0; n < count; n++) {
          const idx = Math.floor(Math.random() * tiles.length)
          tiles[idx].target = 0.4 + Math.random() * 0.6
          tiles[idx].color = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)]
          tiles[idx].speed = 0.008 + Math.random() * 0.015
        }
      }

      // Draw grid lines (very faint, Tron-style)
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.04)'
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

      // Update and draw tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c
          const tile = tiles[idx]

          // Ease brightness toward target
          if (tile.brightness < tile.target) {
            tile.brightness = Math.min(tile.target, tile.brightness + tile.speed * 3)
          } else {
            tile.brightness = Math.max(0, tile.brightness - tile.speed)
          }

          // Once reached target, start fading to 0
          if (Math.abs(tile.brightness - tile.target) < 0.01 && tile.target > 0) {
            tile.target = 0
          }

          if (tile.brightness < 0.005) continue // skip invisible tiles

          const x = c * (tileSize + gap) + gap
          const y = r * (tileSize + gap) + gap

          const [cr, cg, cb] = tile.color
          const a = tile.brightness

          // Tile fill
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.15})`
          ctx.fillRect(x, y, tileSize - gap, tileSize - gap)

          // Tile border (brighter)
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.4})`
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, tileSize - gap, tileSize - gap)

          // Glow effect for bright tiles
          if (a > 0.5) {
            const glow = a * 0.12
            ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${glow})`
            ctx.shadowBlur = 15
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.08})`
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
      window.removeEventListener('resize', initGrid)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#080808',
      }}
    />
  )
}
