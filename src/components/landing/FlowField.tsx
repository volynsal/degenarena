'use client'

import { useEffect, useRef } from 'react'

// Crypto color palette (HSL hues)
const COLORS = {
  purple: 270,    // DegenArena purple
  cyan: 175,      // Teal/cyan
  gold: 45,       // Bitcoin gold
  green: 145,     // Bullish green
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Detect mobile once
    const isMobile = window.innerWidth < 768 || 
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    // Canvas setup - simple, no DPR scaling on mobile for performance
    let width = window.innerWidth
    let height = window.innerHeight
    
    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Particle system - MUCH fewer on mobile
    const particleCount = isMobile ? 60 : 300
    const particles: {
      x: number
      y: number
      vx: number
      vy: number
      hue: number
      size: number
      life: number
      maxLife: number
    }[] = []
    
    // Color picker
    const getHue = () => {
      const r = Math.random()
      if (r < 0.4) return COLORS.purple + (Math.random() - 0.5) * 20
      if (r < 0.7) return COLORS.cyan + (Math.random() - 0.5) * 20
      if (r < 0.85) return COLORS.gold + (Math.random() - 0.5) * 15
      return COLORS.green + (Math.random() - 0.5) * 15
    }
    
    // Create particle
    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.3 - Math.random() * 0.4, // Upward bias
      hue: getHue(),
      size: isMobile ? 2 : 1.5 + Math.random() * 1.5,
      life: 0,
      maxLife: 150 + Math.random() * 150
    })
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle())
    }
    
    // Simple flow noise
    const flowNoise = (x: number, y: number, t: number) => {
      return Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t * 0.7) * Math.PI * 2
    }
    
    // Mouse tracking
    let mouseX = 0, mouseY = 0, mouseActive = false
    
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      mouseActive = true
    }
    const onMouseLeave = () => { mouseActive = false }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        mouseX = e.touches[0].clientX
        mouseY = e.touches[0].clientY
        mouseActive = true
      }
    }
    const onTouchEnd = () => { mouseActive = false }
    
    window.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    
    // Animation
    let time = 0
    let lastTime = 0
    
    const animate = (timestamp: number) => {
      // Frame limiting for mobile (target ~24fps)
      if (isMobile && timestamp - lastTime < 41) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastTime = timestamp
      
      // Clear with fade
      ctx.fillStyle = isMobile ? 'rgba(8, 8, 8, 0.12)' : 'rgba(8, 8, 8, 0.06)'
      ctx.fillRect(0, 0, width, height)
      
      time += 0.01
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Flow field
        const angle = flowNoise(p.x, p.y, time)
        p.vx += Math.cos(angle) * 0.08
        p.vy += Math.sin(angle) * 0.08 - 0.015 // Upward drift
        
        // Mouse influence
        if (mouseActive) {
          const dx = mouseX - p.x
          const dy = mouseY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120 * 0.2
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }
        
        // Friction and movement
        p.vx *= 0.96
        p.vy *= 0.96
        p.x += p.vx
        p.y += p.vy
        p.life++
        
        // Alpha based on life
        const lifeRatio = p.life / p.maxLife
        let alpha = 1
        if (lifeRatio < 0.1) alpha = lifeRatio * 10
        else if (lifeRatio > 0.85) alpha = (1 - lifeRatio) / 0.15
        
        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 85%, 60%, ${alpha * 0.6})`
        ctx.fill()
        
        // Reset if needed
        if (p.x < -20 || p.x > width + 20 || 
            p.y < -20 || p.y > height + 20 || 
            p.life > p.maxLife) {
          particles[i] = createParticle()
          // Spawn from bottom half for upward flow
          if (Math.random() > 0.3) {
            particles[i].y = height + 10
            particles[i].x = Math.random() * width
          }
        }
      }
      
      // Draw connections between close particles (desktop only)
      if (!isMobile) {
        ctx.lineWidth = 0.5
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x
            const dy = particles[i].y - particles[j].y
            const dist = dx * dx + dy * dy // Skip sqrt for performance
            if (dist < 6400) { // 80px squared
              const alpha = (1 - dist / 6400) * 0.12
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `hsla(${(particles[i].hue + particles[j].hue) / 2}, 70%, 55%, ${alpha})`
              ctx.stroke()
            }
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      cancelAnimationFrame(animationRef.current)
    }
  }, [])
  
  return (
    <canvas
      ref={canvasRef}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
