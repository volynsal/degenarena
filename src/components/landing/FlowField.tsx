'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
}

export function FlowField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    
    // Flow field parameters
    const scale = 20
    let time = 0
    
    // Noise function (simplex-like)
    const noise = (x: number, y: number, z: number): number => {
      const X = Math.floor(x) & 255
      const Y = Math.floor(y) & 255
      const Z = Math.floor(z) & 255
      x -= Math.floor(x)
      y -= Math.floor(y)
      z -= Math.floor(z)
      const u = fade(x)
      const v = fade(y)
      const w = fade(z)
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z
      const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z
      return lerp(w, lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
        lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
        lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
          lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))))
    }
    
    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
    const lerp = (t: number, a: number, b: number) => a + t * (b - a)
    const grad = (hash: number, x: number, y: number, z: number) => {
      const h = hash & 15
      const u = h < 8 ? x : y
      const v = h < 4 ? y : h === 12 || h === 14 ? x : z
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
    }
    
    // Permutation table
    const p = new Array(512)
    const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180]
    for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i]
    
    // Create particles - using DegenArena brand colors
    // Purple: #9945FF (hue ~265), Cyan/Green: #14F195 (hue ~156)
    const createParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 100 + Math.random() * 200,
      size: 1 + Math.random() * 2,
      hue: Math.random() > 0.5 ? 265 + Math.random() * 20 : 156 + Math.random() * 15 // Arena purple or cyan
    })
    
    // Initialize particles
    const particleCount = Math.min(600, Math.floor((canvas.width * canvas.height) / 4000))
    particlesRef.current = Array.from({ length: particleCount }, createParticle)
    
    // Mouse tracking - listen on window so it works even with pointer-events: none
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }
    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    
    // Animation loop
    const animate = () => {
      // Fade effect for trails
      ctx.fillStyle = 'rgba(10, 10, 15, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      time += 0.003
      
      particlesRef.current.forEach((particle, i) => {
        // Get flow field angle
        const col = Math.floor(particle.x / scale)
        const row = Math.floor(particle.y / scale)
        const noiseVal = noise(col * 0.05, row * 0.05, time)
        const angle = noiseVal * Math.PI * 4
        
        // Mouse influence
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x
          const dy = mouseRef.current.y - particle.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const force = (150 - dist) / 150
            particle.vx += (dx / dist) * force * 0.3
            particle.vy += (dy / dist) * force * 0.3
          }
        }
        
        // Apply flow field
        particle.vx += Math.cos(angle) * 0.15
        particle.vy += Math.sin(angle) * 0.15
        
        // Friction
        particle.vx *= 0.98
        particle.vy *= 0.98
        
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.life++
        
        // Draw particle
        const lifeRatio = particle.life / particle.maxLife
        const alpha = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.9 ? (1 - lifeRatio) * 10 : 1
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${particle.hue}, 80%, 60%, ${alpha * 0.5})`
        ctx.fill()
        
        // Add glow effect for some particles
        if (Math.random() > 0.995) {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.size * 4)
          gradient.addColorStop(0, `hsla(${particle.hue}, 100%, 70%, 0.4)`)
          gradient.addColorStop(1, 'transparent')
          ctx.fillStyle = gradient
          ctx.fill()
        }
        
        // Reset particle if out of bounds or life ended
        if (particle.x < 0 || particle.x > canvas.width ||
            particle.y < 0 || particle.y > canvas.height ||
            particle.life > particle.maxLife) {
          particlesRef.current[i] = createParticle()
        }
      })
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ 
        zIndex: 0,
        background: 'transparent',
        pointerEvents: 'none'
      }}
    />
  )
}
