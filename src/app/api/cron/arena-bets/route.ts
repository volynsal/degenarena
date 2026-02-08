import { NextRequest, NextResponse } from 'next/server'
import { generateMarkets, resolveMarkets } from '@/lib/services/arena-bets'

// GET /api/cron/arena-bets — Generate new markets + resolve expired ones
// Should be called every 10-15 minutes by an external cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🎰 Arena Bets cron: starting...')

    // 1. Resolve expired markets first
    const resolution = await resolveMarkets()
    console.log(`✅ Resolved: ${resolution.resolved}, cancelled: ${resolution.cancelled}, errors: ${resolution.errors}`)

    // 2. Generate new markets from recent token matches
    const generation = await generateMarkets()
    console.log(`✅ Generated: ${generation.created} new markets, skipped: ${generation.skipped}`)

    return NextResponse.json({
      success: true,
      resolved: resolution,
      generated: generation,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Arena Bets cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
