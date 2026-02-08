'use client'

import { useEffect, useRef } from 'react'

// Arena palette: heavy on purple/cyan, hint of gold
const COLORS = [270, 270, 175, 175, 270, 45] // weighted toward purple & cyan

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
    
    // === FLOW PARTICLES ===
    const count = isMobile ? 60 : 220
    
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
      maxAge: 250 + Math.random() * 250
    })
    
    for (let i = 0; i < count; i++) particles.push(spawn())
    
    // === ENERGY PULSES ===
    interface EnergyPulse {
      x: number; y: number
      radius: number; maxRadius: number
      alpha: number
      hue: number // 270=purple, 175=cyan
    }
    
    const pulses: EnergyPulse[] = []
    let nextPulseIn = 300 + Math.random() * 200 // frames (~5-8 seconds)
    
    // === MOUSE ===
    let mx = 0, my = 0, mActive = false
    const onMove = (x: number, y: number) => { mx = x; my = y; mActive = true }
    const onEnd = () => { mActive = false }
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY))
    document.addEventListener('mouseleave', onEnd)
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY)
    }, { passive: true })
    window.addEventListener('touchend', onEnd)
    
    // === GLITCH STATE (rare + minimal) ===
    let glitchTimer = 0
    let glitchActive = false
    let glitchDuration = 0
    // 480-720 frames = ~8-12 seconds at 60fps
    let nextGlitchIn = 480 + Math.random() * 240
    
    // === ANIMATION ===
    let lastTime = performance.now()
    let time = 0
    let frameCount = 0
    let animId = 0
    
    const loop = () => {
      const now = performance.now()
      const delta = Math.min(now - lastTime, 50)
      lastTime = now
      time += delta * 0.00003
      frameCount++
      
      // Fade trails
      ctx.fillStyle = 'rgba(8, 8, 8, 0.06)'
      ctx.fillRect(0, 0, width, height)
      
      // === VIGNETTE (drawn rarely for performance, accumulates via trail fade) ===
      if (frameCount % 60 === 0) {
        const vignette = ctx.createRadialGradient(
          width / 2, height / 2, height * 0.25,
          width / 2, height / 2, Math.max(width, height) * 0.75
        )
        vignette.addColorStop(0, 'rgba(8, 8, 8, 0)')
        vignette.addColorStop(1, 'rgba(8, 8, 8, 0.15)')
        ctx.fillStyle = vignette
        ctx.fillRect(0, 0, width, height)
      }
      
      // === FLOW PARTICLES ===
      const speed = delta * 0.001
      
      for (let i = 0; i < count; i++) {
        const p = particles[i]
        
        const nx = p.x * 0.008
        const ny = p.y * 0.008
        const angle = (Math.sin(nx + time * 30) + Math.cos(ny + time * 20)) * Math.PI
        
        p.vx += Math.cos(angle) * speed * 5
        p.vy += Math.sin(angle) * speed * 5 - speed * 1.5
        
        // Mouse attraction
        if (mActive) {
          const dx = mx - p.x
          const dy = my - p.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120 && d > 1) {
            const f = (120 - d) / 120 * speed * 15
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
        let alpha = 0.55
        if (lifeRatio < 0.15) alpha = lifeRatio / 0.15 * 0.55
        else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2 * 0.55
        
        // HSL to RGB approximation
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
          if (Math.random() > 0.4) newP.y = height + 15
          particles[i] = newP
        }
      }
      
      // === CONNECTION LINES (pulsing network) ===
      if (!isMobile) {
        const maxDist = 80
        const maxDistSq = maxDist * maxDist
        // Subtle pulsing glow on line opacity
        const linePulse = 1 + Math.sin(frameCount * 0.02) * 0.3
        
        ctx.lineWidth = 0.5
        for (let i = 0; i < count; i += 2) {
          const p1 = particles[i]
          for (let j = i + 2; j < count; j += 2) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy
            if (distSq < maxDistSq) {
              const alpha = (1 - distSq / maxDistSq) * 0.12 * linePulse
              const avgHue = (p1.hue + p2.hue) / 2
              const lr = avgHue < 60 ? 200 : avgHue < 180 ? Math.round((180 - avgHue) / 120 * 200) : avgHue > 300 ? 200 : avgHue > 240 ? Math.round((avgHue - 240) / 60 * 200) : 50
              const lg = avgHue < 60 ? Math.round(avgHue / 60 * 200) : avgHue < 180 ? 200 : avgHue < 240 ? Math.round((240 - avgHue) / 60 * 200) : 50
              const lb = avgHue < 120 ? 50 : avgHue < 180 ? Math.round((avgHue - 120) / 60 * 200) : avgHue < 300 ? 200 : Math.round((360 - avgHue) / 60 * 200)
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha})`
              ctx.stroke()
            }
          }
        }
      }
      
      // === ENERGY PULSES (arena-style radial bursts) ===
      nextPulseIn--
      if (nextPulseIn <= 0) {
        const isFromParticle = Math.random() < 0.6 && count > 0
        let px: number, py: number
        if (isFromParticle) {
          const srcP = particles[Math.floor(Math.random() * count)]
          px = srcP.x
          py = srcP.y
        } else {
          px = width * (0.15 + Math.random() * 0.7)
          py = height * (0.15 + Math.random() * 0.7)
        }
        
        pulses.push({
          x: px, y: py,
          radius: 0,
          maxRadius: isMobile ? 120 + Math.random() * 80 : 180 + Math.random() * 150,
          alpha: isMobile ? 0.12 : 0.15,
          hue: Math.random() < 0.6 ? 270 : 175, // purple or cyan
        })
        
        nextPulseIn = (isMobile ? 350 : 300) + Math.random() * (isMobile ? 200 : 180)
      }
      
      // Draw pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i]
        pulse.radius += delta * (isMobile ? 0.08 : 0.1)
        pulse.alpha *= 0.985
        
        if (pulse.alpha < 0.003 || pulse.radius > pulse.maxRadius) {
          pulses.splice(i, 1)
          continue
        }
        
        // Radial gradient glow
        const grad = ctx.createRadialGradient(
          pulse.x, pulse.y, 0,
          pulse.x, pulse.y, pulse.radius
        )
        
        const isPurple = pulse.hue === 270
        const coreColor = isPurple ? '153, 69, 255' : '20, 200, 220'
        
        grad.addColorStop(0, `rgba(${coreColor}, ${pulse.alpha * 0.8})`)
        grad.addColorStop(0.4, `rgba(${coreColor}, ${pulse.alpha * 0.3})`)
        grad.addColorStop(1, `rgba(${coreColor}, 0)`)
        
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, 6.28)
        ctx.fill()
        
        // Faint ring at the edge
        ctx.beginPath()
        ctx.arc(pulse.x, pulse.y, pulse.radius, 0, 6.28)
        ctx.strokeStyle = `rgba(${coreColor}, ${pulse.alpha * 0.5})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      
      // === NEON HORIZON GLOW (bottom edge, like arena stage lighting) ===
      if (frameCount % 4 === 0) {
        const glowHeight = isMobile ? 60 : 100
        const horizonGrad = ctx.createLinearGradient(0, height - glowHeight, 0, height)
        
        // Slowly shift between purple and cyan
        const horizonPhase = Math.sin(frameCount * 0.005) * 0.5 + 0.5
        const pr = Math.round(153 * (1 - horizonPhase) + 20 * horizonPhase)
        const pg = Math.round(69 * (1 - horizonPhase) + 200 * horizonPhase)
        const pb = Math.round(255 * (1 - horizonPhase) + 220 * horizonPhase)
        
        horizonGrad.addColorStop(0, 'rgba(8, 8, 8, 0)')
        horizonGrad.addColorStop(0.7, `rgba(${pr}, ${pg}, ${pb}, 0.015)`)
        horizonGrad.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0.04)`)
        ctx.fillStyle = horizonGrad
        ctx.fillRect(0, height - glowHeight, width, glowHeight)
      }
      
      // === GLITCH (rare, brief, broadcast-style) ===
      nextGlitchIn--
      
      if (nextGlitchIn <= 0 && !glitchActive) {
        glitchActive = true
        glitchDuration = 2 + Math.floor(Math.random() * 2) // 2-3 frames only
        glitchTimer = 0
        nextGlitchIn = 480 + Math.random() * 300 // 8-13 seconds
      }
      
      if (glitchActive) {
        glitchTimer++
        
        // Small horizontal slice displacement only
        const numSlices = 1 + Math.floor(Math.random() * 3)
        for (let g = 0; g < numSlices; g++) {
          const sliceY = Math.floor(Math.random() * height)
          const sliceH = Math.floor(2 + Math.random() * (isMobile ? 6 : 10))
          const shiftX = Math.floor((Math.random() - 0.5) * (isMobile ? 15 : 30))
          
          try {
            const safeY = Math.max(0, Math.min(sliceY, height - 1))
            const safeH = Math.min(sliceH, height - safeY)
            if (safeH > 0) {
              const imgData = ctx.getImageData(0, safeY, width, safeH)
              ctx.putImageData(imgData, shiftX, safeY)
            }
          } catch(e) { /* ignore */ }
        }
        
        // Single faint scan line
        const lineY = Math.floor(Math.random() * height)
        const lineColor = Math.random() < 0.5 ? '153, 69, 255' : '20, 200, 220'
        ctx.fillStyle = `rgba(${lineColor}, ${0.06 + Math.random() * 0.06})`
        ctx.fillRect(0, lineY, width, 1)
        
        if (glitchTimer >= glitchDuration) {
          glitchActive = false
        }
      }
      
      // === SUBTLE SCAN LINES (desktop only, very faint CRT) ===
      if (!isMobile && frameCount % 5 === 0) {
        for (let y = 0; y < height; y += 4) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.012)'
          ctx.fillRect(0, y, width, 1)
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
