'use client'

import { useEffect, useRef } from 'react'

// Crypto color palette (HSL hues)
const COLORS = [270, 175, 45, 145] // purple, cyan, gold, green

// Matrix/crypto characters
const MATRIX_CHARS = '₿ΞΣ◎$01234567890ABCDEFabcdef{}[]<>:;/|\\+=*&^%#@!~'
const HEX_CHARS = '0123456789ABCDEF'

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
    const count = isMobile ? 50 : 200
    
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
    
    // === MATRIX RAIN COLUMNS ===
    const fontSize = isMobile ? 12 : 14
    const columnWidth = fontSize * 1.2
    const numColumns = Math.floor(width / columnWidth)
    const matrixDrops: number[] = new Array(numColumns).fill(0).map(() => -Math.random() * height / fontSize)
    const matrixSpeeds: number[] = new Array(numColumns).fill(0).map(() => 0.3 + Math.random() * 0.8)
    const matrixChars: string[] = new Array(numColumns).fill('').map(() => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)])
    // Only render a fraction of columns for subtlety
    const activeColumns: boolean[] = new Array(numColumns).fill(false).map(() => Math.random() < (isMobile ? 0.06 : 0.10))
    
    // === DATA STREAM BLOCKS (floating hex fragments) ===
    interface DataBlock {
      x: number; y: number; vy: number
      text: string; alpha: number; fadeSpeed: number
      color: string
    }
    
    const dataBlocks: DataBlock[] = []
    const maxDataBlocks = isMobile ? 3 : 8
    
    const spawnDataBlock = () => {
      const colors = ['20, 241, 149', '153, 69, 255', '255, 200, 55', '100, 200, 255']
      const hexLen = 4 + Math.floor(Math.random() * 8)
      let text = '0x'
      for (let i = 0; i < hexLen; i++) text += HEX_CHARS[Math.floor(Math.random() * 16)]
      
      // Occasionally use crypto-style text
      if (Math.random() < 0.3) {
        const phrases = ['BLOCK #', 'TX: 0x', 'GAS: ', 'SOL: ', 'HASH: ', 'MINT: ', 'SWAP: ']
        text = phrases[Math.floor(Math.random() * phrases.length)]
        for (let i = 0; i < 6; i++) text += HEX_CHARS[Math.floor(Math.random() * 16)]
      }
      
      return {
        x: 20 + Math.random() * (width - 200),
        y: Math.random() * height,
        vy: -0.2 - Math.random() * 0.5,
        text,
        alpha: 0,
        fadeSpeed: 0.005 + Math.random() * 0.01,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
    }
    
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
    
    // === GLITCH STATE ===
    let glitchTimer = 0
    let glitchActive = false
    let glitchDuration = 0
    let nextGlitchIn = 60 + Math.random() * 180 // frames until next glitch burst
    
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
      ctx.fillStyle = 'rgba(8, 8, 8, 0.07)'
      ctx.fillRect(0, 0, width, height)
      
      // === MATRIX RAIN ===
      ctx.font = `${fontSize}px monospace`
      for (let col = 0; col < numColumns; col++) {
        if (!activeColumns[col]) continue
        
        matrixDrops[col] += matrixSpeeds[col] * (delta * 0.06)
        
        const y = matrixDrops[col] * fontSize
        
        if (y > 0 && y < height) {
          // Head character (bright)
          matrixChars[col] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          const x = col * columnWidth
          
          // Bright green/cyan head
          ctx.fillStyle = `rgba(20, 241, 149, ${0.7 + Math.random() * 0.3})`
          ctx.fillText(matrixChars[col], x, y)
          
          // Trail characters (fading)
          const trailLen = isMobile ? 4 : 8
          for (let t = 1; t <= trailLen; t++) {
            const trailY = y - t * fontSize
            if (trailY < 0) break
            const trailAlpha = (1 - t / trailLen) * 0.25
            const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
            
            // Alternate between green and purple
            if (t % 3 === 0) {
              ctx.fillStyle = `rgba(153, 69, 255, ${trailAlpha})`
            } else {
              ctx.fillStyle = `rgba(20, 241, 149, ${trailAlpha})`
            }
            ctx.fillText(char, x, trailY)
          }
        }
        
        // Reset column when it reaches bottom
        if (y > height + fontSize * 10) {
          matrixDrops[col] = -Math.random() * 20
          matrixSpeeds[col] = 0.3 + Math.random() * 0.8
          // Randomly toggle columns for variety
          if (Math.random() < 0.3) {
            activeColumns[col] = false
            // Activate a different column
            const newCol = Math.floor(Math.random() * numColumns)
            activeColumns[newCol] = true
          }
        }
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
      
      // === CONNECTION LINES (desktop only) ===
      if (!isMobile) {
        ctx.lineWidth = 0.4
        const maxDistSq = 70 * 70
        for (let i = 0; i < count; i += 2) {
          const p1 = particles[i]
          for (let j = i + 2; j < count; j += 2) {
            const p2 = particles[j]
            const dx = p1.x - p2.x
            const dy = p1.y - p2.y
            const distSq = dx * dx + dy * dy
            if (distSq < maxDistSq) {
              const alpha = (1 - distSq / maxDistSq) * 0.1
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
      
      // === FLOATING DATA BLOCKS ===
      // Spawn new blocks occasionally
      if (dataBlocks.length < maxDataBlocks && Math.random() < 0.015) {
        dataBlocks.push(spawnDataBlock())
      }
      
      ctx.font = `${isMobile ? 9 : 11}px monospace`
      for (let i = dataBlocks.length - 1; i >= 0; i--) {
        const db = dataBlocks[i]
        db.y += db.vy
        
        // Fade in then out
        if (db.alpha < 0.3) {
          db.alpha += db.fadeSpeed * delta
        } else {
          db.alpha -= db.fadeSpeed * 0.3 * delta
        }
        
        if (db.alpha <= 0 || db.y < -20) {
          dataBlocks.splice(i, 1)
          continue
        }
        
        ctx.fillStyle = `rgba(${db.color}, ${Math.min(db.alpha, 0.35)})`
        ctx.fillText(db.text, db.x, db.y)
        
        // Randomly mutate a character
        if (Math.random() < 0.02) {
          const chars = db.text.split('')
          const idx = 2 + Math.floor(Math.random() * (chars.length - 2))
          chars[idx] = HEX_CHARS[Math.floor(Math.random() * 16)]
          db.text = chars.join('')
        }
      }
      
      // === GLITCH SYSTEM ===
      nextGlitchIn -= 1
      
      if (nextGlitchIn <= 0 && !glitchActive) {
        glitchActive = true
        glitchDuration = 3 + Math.floor(Math.random() * 12) // 3-15 frames of glitch
        glitchTimer = 0
        nextGlitchIn = (isMobile ? 120 : 80) + Math.random() * (isMobile ? 300 : 200)
      }
      
      if (glitchActive) {
        glitchTimer++
        const intensity = Math.random()
        
        // --- HORIZONTAL SLICE DISPLACEMENT ---
        const numSlices = 2 + Math.floor(Math.random() * (intensity > 0.5 ? 10 : 5))
        for (let g = 0; g < numSlices; g++) {
          const sliceY = Math.floor(Math.random() * height)
          const sliceH = Math.floor(2 + Math.random() * (isMobile ? 12 : 25))
          const shiftX = Math.floor((Math.random() - 0.5) * (isMobile ? 30 : 80))
          
          try {
            const imgData = ctx.getImageData(0, Math.max(0, sliceY), width, Math.min(sliceH, height - sliceY))
            ctx.putImageData(imgData, shiftX, sliceY)
          } catch(e) { /* ignore */ }
        }
        
        // --- CHROMATIC ABERRATION (RGB channel split) ---
        if (!isMobile && intensity > 0.3) {
          const aberrationSize = 2 + Math.floor(Math.random() * 4)
          try {
            const fullImage = ctx.getImageData(0, 0, width, height)
            const shifted = ctx.createImageData(width, height)
            
            // Only shift a horizontal band for performance
            const bandY = Math.floor(Math.random() * height)
            const bandH = 30 + Math.floor(Math.random() * 100)
            
            for (let y = bandY; y < Math.min(bandY + bandH, height); y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4
                const rIdx = (y * width + Math.min(x + aberrationSize, width - 1)) * 4
                const bIdx = (y * width + Math.max(x - aberrationSize, 0)) * 4
                
                shifted.data[idx] = fullImage.data[rIdx]       // Red shifted right
                shifted.data[idx + 1] = fullImage.data[idx + 1] // Green stays
                shifted.data[idx + 2] = fullImage.data[bIdx + 2] // Blue shifted left
                shifted.data[idx + 3] = 255
              }
            }
            
            // Copy non-band area
            for (let y = 0; y < height; y++) {
              if (y >= bandY && y < bandY + bandH) continue
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4
                shifted.data[idx] = fullImage.data[idx]
                shifted.data[idx + 1] = fullImage.data[idx + 1]
                shifted.data[idx + 2] = fullImage.data[idx + 2]
                shifted.data[idx + 3] = fullImage.data[idx + 3]
              }
            }
            
            ctx.putImageData(shifted, 0, 0)
          } catch(e) { /* ignore */ }
        }
        
        // --- SCAN LINE FLASH ---
        if (intensity > 0.2) {
          const numLines = 1 + Math.floor(Math.random() * 3)
          for (let l = 0; l < numLines; l++) {
            const lineY = Math.floor(Math.random() * height)
            const lineColor = Math.random() < 0.5 
              ? `rgba(20, 241, 149, ${0.08 + Math.random() * 0.15})`
              : `rgba(153, 69, 255, ${0.06 + Math.random() * 0.12})`
            ctx.fillStyle = lineColor
            ctx.fillRect(0, lineY, width, 1 + Math.floor(Math.random() * 2))
          }
        }
        
        // --- GLITCH TEXT FLASH ---
        if (intensity > 0.6 && Math.random() < 0.5) {
          ctx.font = `bold ${isMobile ? 10 : 13}px monospace`
          const texts = ['ERR:0x', 'BLOCK_', 'SYNC..', '>>>>>>',  '██████', '▓▓▓▓▓▓', 'VERIFY', 'HASH: ', 'MINT: ']
          const text = texts[Math.floor(Math.random() * texts.length)] + 
            Array.from({length: 4}, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('')
          const tx = Math.random() * (width - 150)
          const ty = Math.random() * height
          ctx.fillStyle = `rgba(20, 241, 149, ${0.15 + Math.random() * 0.25})`
          ctx.fillText(text, tx, ty)
        }
        
        // --- BLOCK CORRUPTION (rectangle artifacts) ---
        if (intensity > 0.7) {
          const numBlocks = 1 + Math.floor(Math.random() * 3)
          for (let b = 0; b < numBlocks; b++) {
            const bx = Math.random() * width
            const by = Math.random() * height
            const bw = 10 + Math.random() * (isMobile ? 40 : 80)
            const bh = 2 + Math.random() * (isMobile ? 6 : 12)
            const colors = ['20, 241, 149', '153, 69, 255', '255, 200, 55']
            ctx.fillStyle = `rgba(${colors[Math.floor(Math.random() * colors.length)]}, ${0.05 + Math.random() * 0.1})`
            ctx.fillRect(bx, by, bw, bh)
          }
        }
        
        if (glitchTimer >= glitchDuration) {
          glitchActive = false
        }
      }
      
      // === SUBTLE PERSISTENT EFFECTS ===
      // Dim scan lines overlay (very subtle CRT feel)
      if (!isMobile && frameCount % 3 === 0) {
        for (let y = 0; y < height; y += 4) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
          ctx.fillRect(0, y, width, 1)
        }
      }
      
      // Occasional single scan line sweep
      if (Math.random() < 0.01) {
        const sweepY = Math.floor(Math.random() * height)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'
        ctx.fillRect(0, sweepY, width, 2)
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
