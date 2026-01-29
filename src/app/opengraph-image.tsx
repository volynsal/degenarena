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
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(168, 85, 247, 0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '20%',
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 255, 157, 0.1) 0%, transparent 70%)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #a855f7 0%, #00ff9d 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-2px',
              }}
            >
              DEGENARENA
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 800,
                color: '#ffffff',
                marginLeft: 16,
                letterSpacing: '-2px',
              }}
            >
              HQ
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 32,
              color: '#a1a1aa',
              marginBottom: 40,
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
            {['Token Filters', 'Instant Alerts', 'Flip Battles', 'Clan Wars'].map((feature) => (
              <div
                key={feature}
                style={{
                  padding: '12px 24px',
                  borderRadius: 50,
                  background: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#e4e4e7',
                  fontSize: 18,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #a855f7 0%, #00ff9d 50%, #a855f7 100%)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
