'use client'

export function FlowField() {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        objectFit: 'cover',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <source src="/animation.mp4" type="video/mp4" />
    </video>
  )
}
