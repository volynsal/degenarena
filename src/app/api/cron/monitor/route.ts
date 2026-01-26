import { NextRequest, NextResponse } from 'next/server'
import { tokenMonitor } from '@/lib/services/token-monitor'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// For security, it checks for a secret token

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    console.log('🚀 Cron job: Starting token monitoring...')
    
    const results = await tokenMonitor.runMonitoringCycle()
    
    const summary = {
      timestamp: new Date().toISOString(),
      formulasWithMatches: results.length,
      totalMatches: results.reduce((sum, r) => sum + r.matchedTokens.length, 0),
      details: results.map(r => ({
        formula: r.formulaName,
        matches: r.matchedTokens.map(m => m.pair.baseToken.symbol),
      })),
    }
    
    console.log('📊 Monitoring summary:', JSON.stringify(summary, null, 2))
    
    return NextResponse.json({
      success: true,
      ...summary,
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
