'use client'

import { useEffect, useRef } from 'react'

export function FlowField() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Remove any default controls
    video.controls = false

    // Force muted + play
    video.muted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')

    const tryPlay = () => {
      video.play().catch(() => {})
    }

    // Play immediately
    tryPlay()

    // Also play when video data is ready (handles slow loads)
    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('canplay', tryPlay)

    // Fallback: play on first user interaction if autoplay blocked
    const handleInteraction = () => {
      tryPlay()
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
    }
    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)
    document.addEventListener('scroll', handleInteraction)

    return () => {
      video.removeEventListener('loadeddata', tryPlay)
      video.removeEventListener('canplay', tryPlay)
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
    }
  }, [])

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      controls={false}
      src="/animation.mp4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        objectFit: 'cover',
        zIndex: 0,
        pointerEvents: 'none',
        background: '#080808',
      }}
    />
  )
}
