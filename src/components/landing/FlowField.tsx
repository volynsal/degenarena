'use client'

import { useEffect, useRef } from 'react'

// =============================================
// VIDEO BACKGROUND (landing page / waitlist)
// Native <video> element — reliable autoplay, no controls
// =============================================

export function VideoBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Create a completely hidden video element — NOT in the DOM tree,
    // so Safari has no UI element to attach a play button to.
    const video = document.createElement('video')
    video.src = '/grok-video-246d9a09-191b-4cbf-ad90-1e78efe57863-2.mp4'
    video.muted = true
    video.loop = true
    video.playsInline = true
    video.preload = 'auto'
    video.setAttribute('playsinline', '')          // iOS requires attribute
    video.setAttribute('webkit-playsinline', '')   // older iOS
    video.setAttribute('muted', '')                // attribute form for Safari
    videoRef.current = video

    // Size canvas to fill viewport
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Draw loop: paint video frame + dark overlay onto canvas
    let animId = 0
    let playing = false

    const draw = () => {
      if (playing && video.readyState >= 2) {
        const vw = video.videoWidth
        const vh = video.videoHeight
        const cw = canvas.width
        const ch = canvas.height

        // Cover-fit calculation (same as object-fit: cover)
        const scale = Math.max(cw / vw, ch / vh)
        const dw = vw * scale
        const dh = vh * scale
        const dx = (cw - dw) / 2
        const dy = (ch - dh) / 2

        ctx.drawImage(video, dx, dy, dw, dh)

        // Darken overlay for readability
        const grad = ctx.createLinearGradient(0, 0, 0, ch)
        grad.addColorStop(0, 'rgba(8,8,8,0.55)')
        grad.addColorStop(0.4, 'rgba(8,8,8,0.35)')
        grad.addColorStop(0.6, 'rgba(8,8,8,0.35)')
        grad.addColorStop(1, 'rgba(8,8,8,0.6)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, cw, ch)
      }
      animId = requestAnimationFrame(draw)
    }

    // Attempt autoplay
    const tryPlay = () => {
      video.muted = true
      video.play().then(() => {
        playing = true
      }).catch(() => {
        // Autoplay blocked — wait for any user gesture
      })
    }

    // Try multiple times to cover Safari timing quirks
    tryPlay()
    const t1 = setTimeout(tryPlay, 200)
    const t2 = setTimeout(tryPlay, 800)
    const t3 = setTimeout(tryPlay, 2000)

    // Fallback: play on first user interaction
    const onGesture = () => {
      tryPlay()
      document.removeEventListener('click', onGesture)
      document.removeEventListener('touchstart', onGesture)
      document.removeEventListener('scroll', onGesture)
    }
    document.addEventListener('click', onGesture)
    document.addEventListener('touchstart', onGesture)
    document.addEventListener('scroll', onGesture)

    // Start render loop
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      window.removeEventListener('resize', resize)
      document.removeEventListener('click', onGesture)
      document.removeEventListener('touchstart', onGesture)
      document.removeEventListener('scroll', onGesture)
      video.pause()
      video.src = ''
      videoRef.current = null
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#080808',
      }}
    />
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

export function FlowField({ subtle = false }: { subtle?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const isMobile = window.innerWidth < 768 ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    // Intensity multiplier — subtle mode dims everything for use behind content
    const dim = subtle ? 0.45 : 1

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
        // In subtle mode, spawn more tiles at higher brightness to compensate
        // for the dim multiplier so perceived activity matches auth pages
        const count = subtle ? (2 + Math.floor(Math.random() * 2)) : (1 + Math.floor(Math.random() * 2))
        for (let n = 0; n < count; n++) {
          const idx = Math.floor(Math.random() * tiles.length)
          tiles[idx].target = subtle ? (0.6 + Math.random() * 0.4) : (0.4 + Math.random() * 0.6)
          tiles[idx].color = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)]
          tiles[idx].speed = 0.008 + Math.random() * 0.015
        }
      }

      // Draw grid lines (very faint, Tron-style)
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.04 * dim})`
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
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.15 * dim})`
          ctx.fillRect(x, y, tileSize - gap, tileSize - gap)

          // Tile border (brighter)
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.4 * dim})`
          ctx.lineWidth = 1
          ctx.strokeRect(x, y, tileSize - gap, tileSize - gap)

          // Glow effect for bright tiles
          if (a > 0.5) {
            const glow = a * 0.12 * dim
            ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${glow})`
            ctx.shadowBlur = 15
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${a * 0.08 * dim})`
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
  }, [subtle])

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
