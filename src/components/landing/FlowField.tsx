'use client'

import { useEffect, useRef } from 'react'

// Crypto color palette (HSL hues)
const COLORS = [270, 175, 45, 145] // purple, cyan, gold, green

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Force canvas to be visible on Safari
    canvas.style.opacity = '1'
    canvas.style.visibility = 'visible'
    
    const ctx = canvas.getContext('2d', { 
      alpha: false // Opaque canvas is faster
    })
    if (!ctx) return
    
    // Detect mobile
    const isMobile = window.innerWidth < 768 || 
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    // Setup canvas
    let width = 0
    let height = 0
    
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      // Fill with background color immediately
      ctx.fillStyle = '#080808'
      ctx.fillRect(0, 0, width, height)
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Particles - fewer on mobile
    const count = isMobile ? 50 : 250
    
    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      hue: number
      size: number
      age: number
      maxAge: number
    }
    
    const particles: Particle[] = []
    
    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: 0,
      vy: 0,
      hue: COLORS[Math.floor(Math.random() * COLORS.length)] + (Math.random() - 0.5) * 20,
      size: isMobile ? 2.5 : 2,
      age: 0,
      maxAge: 200 + Math.random() * 200
    })
    
    for (let i = 0; i < count; i++) {
      particles.push(spawn())
    }
    
    // Mouse/touch
    let mx = 0, my = 0, mActive = false
    
    const onMove = (x: number, y: number) => { mx = x; my = y; mActive = true }
    const onEnd = () => { mActive = false }
    
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY))
    document.addEventListener('mouseleave', onEnd)
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY)
    }, { passive: true })
    window.addEventListener('touchend', onEnd)
    
    // Animation with delta time for consistent speed
    let lastTime = performance.now()
    let time = 0
    let animId = 0
    
    const loop = () => {
      const now = performance.now()
      const delta = Math.min(now - lastTime, 50) // Cap delta to avoid jumps
      lastTime = now
      
      // Time increment - SAME for both mobile and desktop
      time += delta * 0.00003
      
      // Fade trails - slightly faster fade for cleaner look
      ctx.fillStyle = 'rgba(8, 8, 8, 0.08)'
      ctx.fillRect(0, 0, width, height)
      
      // Update particles
      const speed = delta * 0.001 // Normalized speed factor
      
      for (let i = 0; i < count; i++) {
        const p = particles[i]
        
        // Simple flow field
        const nx = p.x * 0.008
        const ny = p.y * 0.008
        const angle = (Math.sin(nx + time * 30) + Math.cos(ny + time * 20)) * Math.PI
        
        // Apply force (scaled by delta time)
        p.vx += Math.cos(angle) * speed * 5
        p.vy += Math.sin(angle) * speed * 5 - speed * 1.5 // Upward bias
        
        // Mouse attraction
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
        
        // Friction
        p.vx *= 0.95
        p.vy *= 0.95
        
        // Move
        p.x += p.vx
        p.y += p.vy
        p.age += delta * 0.06
        
        // Calculate alpha
        const lifeRatio = p.age / p.maxAge
        let alpha = 0.6
        if (lifeRatio < 0.15) alpha = lifeRatio / 0.15 * 0.6
        else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2 * 0.6
        
        // Draw - use rgba for Safari compatibility
        const h = p.hue
        const r = h < 60 ? 255 : h < 180 ? Math.round((180 - h) / 120 * 255) : h > 300 ? 255 : h > 240 ? Math.round((h - 240) / 60 * 255) : 0
        const g = h < 60 ? Math.round(h / 60 * 255) : h < 180 ? 255 : h < 240 ? Math.round((240 - h) / 60 * 255) : 0
        const b = h < 120 ? 0 : h < 180 ? Math.round((h - 120) / 60 * 255) : h < 300 ? 255 : Math.round((360 - h) / 60 * 255)
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, 6.28)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
        ctx.fill()
        
        // Reset if out of bounds or old
        if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30 || p.age > p.maxAge) {
          const newP = spawn()
          // Spawn from bottom for upward flow
          if (Math.random() > 0.4) {
            newP.y = height + 15
          }
          particles[i] = newP
        }
      }
      
      // Connection lines (desktop only, limit checks for performance)
      if (!isMobile && count <= 250) {
        ctx.lineWidth = 0.4
        const maxDist = 70
        const maxDistSq = maxDist * maxDist
        
        for (let i = 0; i < count; i += 2) { // Check every other particle
          const p1 = particles[i]
          for (let j = i + 2; j < count; j += 2) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy
            
            if (distSq < maxDistSq) {
              const alpha = (1 - distSq / maxDistSq) * 0.1
              const avgHue = (p1.hue + p2.hue) / 2
              const r = avgHue < 60 ? 200 : avgHue < 180 ? Math.round((180 - avgHue) / 120 * 200) : avgHue > 300 ? 200 : avgHue > 240 ? Math.round((avgHue - 240) / 60 * 200) : 50
              const g = avgHue < 60 ? Math.round(avgHue / 60 * 200) : avgHue < 180 ? 200 : avgHue < 240 ? Math.round((240 - avgHue) / 60 * 200) : 50
              const b = avgHue < 120 ? 50 : avgHue < 180 ? Math.round((avgHue - 120) / 60 * 200) : avgHue < 300 ? 200 : Math.round((360 - avgHue) / 60 * 200)
              
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
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
      width={typeof window !== 'undefined' ? window.innerWidth : 1920}
      height={typeof window !== 'undefined' ? window.innerHeight : 1080}
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
