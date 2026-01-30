import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'DegenArena HQ - Competitive Memecoin Trading'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Purple glow */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 200,
            width: 400,
            height: 400,
            borderRadius: 200,
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            filter: 'blur(100px)',
          }}
        />
        
        {/* Cyan glow */}
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            right: 200,
            width: 350,
            height: 350,
            borderRadius: 175,
            backgroundColor: 'rgba(0, 255, 157, 0.1)',
            filter: 'blur(80px)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#a855f7',
              letterSpacing: -3,
            }}
          >
            DEGEN
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#00ff9d',
              letterSpacing: -3,
            }}
          >
            ARENA
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#ffffff',
              marginLeft: 20,
              letterSpacing: -3,
            }}
          >
            HQ
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: '#a1a1aa',
            marginBottom: 48,
            fontWeight: 500,
          }}
        >
          Build, Battle, Prove Your Alpha
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 50,
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              color: '#e4e4e7',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Token Filters
          </div>
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 50,
              backgroundColor: 'rgba(0, 255, 157, 0.15)',
              border: '2px solid rgba(0, 255, 157, 0.3)',
              color: '#e4e4e7',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Instant Alerts
          </div>
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 50,
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              color: '#e4e4e7',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Flip Battles
          </div>
          <div
            style={{
              padding: '14px 28px',
              borderRadius: 50,
              backgroundColor: 'rgba(0, 255, 157, 0.15)',
              border: '2px solid rgba(0, 255, 157, 0.3)',
              color: '#e4e4e7',
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Clan Wars
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
