'use client'

import { useEffect, useRef } from 'react'

export function FlowField() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.controls = false
    video.muted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')

    const tryPlay = () => {
      video.play().catch(() => {})
    }

    tryPlay()
    video.addEventListener('loadeddata', tryPlay)
    video.addEventListener('canplay', tryPlay)

    // Fallback: play on first interaction if autoplay blocked
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
    <>
      {/* Video background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        controls={false}
        src="/grok-video-246d9a09-191b-4cbf-ad90-1e78efe57863.mp4"
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
      {/* Dark overlay — dims the video so text stays readable */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
          background: 'rgba(8, 8, 8, 0.4)',
        }}
      />
    </>
  )
}
