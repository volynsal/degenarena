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
    </div>
  )
}

// =============================================
// PARTICLE BACKGROUND (auth pages)
// Lightweight canvas animation — no video download
// =============================================

const COLORS = [270, 175, 45, 145]

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.style.opacity = '1'
    canvas.style.visibility = 'visible'

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const isMobile = window.innerWidth < 768 ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    let width = 0
    let height = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, width, height)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = isMobile ? 50 : 250

    interface Particle {
      x: number; y: number; vx: number; vy: number
      hue: number; size: number; age: number; maxAge: number
    }

    const particles: Particle[] = []

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0, vy: 0,
      hue: COLORS[Math.floor(Math.random() * COLORS.length)] + (Math.random() - 0.5) * 20,
      size: isMobile ? 2.5 : 2,
      age: 0,
      maxAge: 200 + Math.random() * 200
    })

    for (let i = 0; i < count; i++) particles.push(spawn())

    let mx = 0, my = 0, mActive = false
    const onMove = (x: number, y: number) => { mx = x; my = y; mActive = true }
    const onEnd = () => { mActive = false }

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY))
    document.addEventListener('mouseleave', onEnd)
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY)
    }, { passive: true })
    window.addEventListener('touchend', onEnd)

    let lastTime = performance.now()
    let time = 0
    let animId = 0

    const loop = () => {
      const now = performance.now()
      const delta = Math.min(now - lastTime, 50)
      lastTime = now
      time += delta * 0.00003

      ctx.fillStyle = 'rgba(8, 8, 8, 0.08)'
      ctx.fillRect(0, 0, width, height)

      const speed = delta * 0.001

      for (let i = 0; i < count; i++) {
        const p = particles[i]
        const nx = p.x * 0.008
        const ny = p.y * 0.008
        const angle = (Math.sin(nx + time * 30) + Math.cos(ny + time * 20)) * Math.PI

        p.vx += Math.cos(angle) * speed * 5
        p.vy += Math.sin(angle) * speed * 5 - speed * 1.5

        if (mActive) {
          const dx = mx - p.x
          const dy = my - p.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100 && d > 1) {
            const f = (100 - d) / 100 * speed * 15
            p.vx += (dx / d) * f
            p.vy += (dy / d) * f
          }
        }

        p.vx *= 0.95
        p.vy *= 0.95
        p.x += p.vx
        p.y += p.vy
        p.age += delta * 0.06

        const lifeRatio = p.age / p.maxAge
        let alpha = 0.6
        if (lifeRatio < 0.15) alpha = lifeRatio / 0.15 * 0.6
        else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2 * 0.6

        const h = p.hue
        const r = h < 60 ? 255 : h < 180 ? Math.round((180 - h) / 120 * 255) : h > 300 ? 255 : h > 240 ? Math.round((h - 240) / 60 * 255) : 0
        const g = h < 60 ? Math.round(h / 60 * 255) : h < 180 ? 255 : h < 240 ? Math.round((240 - h) / 60 * 255) : 0
        const b = h < 120 ? 0 : h < 180 ? Math.round((h - 120) / 60 * 255) : h < 300 ? 255 : Math.round((360 - h) / 60 * 255)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, 6.28)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fill()

        if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30 || p.age > p.maxAge) {
          const newP = spawn()
          if (Math.random() > 0.4) newP.y = height + 15
          particles[i] = newP
        }
      }

      if (!isMobile && count <= 250) {
        ctx.lineWidth = 0.4
        const maxDistSq = 4900
        for (let i = 0; i < count; i += 2) {
          const p1 = particles[i]
          for (let j = i + 2; j < count; j += 2) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy
            if (distSq < maxDistSq) {
              const a = (1 - distSq / maxDistSq) * 0.1
              const avgHue = (p1.hue + p2.hue) / 2
              const r2 = avgHue < 60 ? 200 : avgHue < 180 ? Math.round((180 - avgHue) / 120 * 200) : avgHue > 300 ? 200 : avgHue > 240 ? Math.round((avgHue - 240) / 60 * 200) : 50
              const g2 = avgHue < 60 ? Math.round(avgHue / 60 * 200) : avgHue < 180 ? 200 : avgHue < 240 ? Math.round((240 - avgHue) / 60 * 200) : 50
              const b2 = avgHue < 120 ? 50 : avgHue < 180 ? Math.round((avgHue - 120) / 60 * 200) : avgHue < 300 ? 200 : Math.round((360 - avgHue) / 60 * 200)
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${a})`
              ctx.stroke()
            }
          }
        }
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
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
