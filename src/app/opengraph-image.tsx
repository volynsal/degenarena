import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'DegenArena HQ - Competitive Memecoin Trading'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  // Fetch the background image and logo
  const [bgImage, logoImage] = await Promise.all([
    fetch(new URL('/footer-bg.png', 'https://degenarena-azure.vercel.app')).then(res => res.arrayBuffer()),
    fetch(new URL('/logo.png', 'https://degenarena-azure.vercel.app')).then(res => res.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background graffiti image */}
        <img
          src={`data:image/png;base64,${Buffer.from(bgImage).toString('base64')}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        
        {/* Dark overlay for readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.7) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
            position: 'relative',
            padding: 60,
          }}
        >
          {/* Logo in top-left */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <img
              src={`data:image/png;base64,${Buffer.from(logoImage).toString('base64')}`}
              style={{
                width: 60,
                height: 60,
                borderRadius: 12,
              }}
            />
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              DegenArena HQ
            </span>
          </div>

          {/* Main text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 40,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                lineHeight: 1.1,
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              Build, Battle,
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#a855f7',
                textAlign: 'center',
                lineHeight: 1.1,
                textShadow: '0 4px 20px rgba(168,85,247,0.3)',
              }}
            >
              Prove Your Alpha
            </div>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 24,
              color: '#a1a1aa',
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            The competitive memecoin trading platform
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: 'linear-gradient(90deg, #a855f7, #00ff9d, #a855f7)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
