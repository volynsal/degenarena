import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alertService, type AlertPayload } from '@/lib/services/alerts'

// Service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint sends alerts for new matches that haven't been alerted yet
// Should be called frequently (every 1-5 minutes) by a cron job

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    console.log('📨 Cron job: Sending alerts for new matches...')
    
    // Get recent matches that haven't had alerts sent yet
    // We check for matches created in the last hour without corresponding alerts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentMatches } = await supabaseAdmin
      .from('token_matches')
      .select(`
        id,
        formula_id,
        token_address,
        token_name,
        token_symbol,
        chain,
        price_at_match,
        liquidity,
        volume_24h,
        dexscreener_url,
        matched_at,
        formula:formulas(id, name, user_id)
      `)
      .gte('matched_at', oneHourAgo)
      .order('matched_at', { ascending: false })
      .limit(50)
    
    if (!recentMatches || recentMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new matches to alert',
        alertsSent: 0,
      })
    }
    
    let alertsSent = 0
    let alertsFailed = 0
    
    for (const match of recentMatches) {
      const formula = match.formula as any
      if (!formula) continue
      
      // Check if we've already sent alerts for this match
      const { data: existingAlerts } = await supabaseAdmin
        .from('alerts')
        .select('id')
        .eq('token_match_id', match.id)
        .limit(1)
      
      if (existingAlerts && existingAlerts.length > 0) {
        continue // Already alerted
      }
      
      // Prepare alert payload
      const payload: AlertPayload = {
        userId: formula.user_id,
        formulaId: formula.id,
        formulaName: formula.name,
        matchId: match.id,
        tokenSymbol: match.token_symbol,
        tokenName: match.token_name,
        tokenAddress: match.token_address,
        chain: match.chain,
        price: match.price_at_match,
        liquidity: match.liquidity || 0,
        volume24h: match.volume_24h || 0,
        dexscreenerUrl: match.dexscreener_url || '',
      }
      
      // Send alerts
      const results = await alertService.sendMatchAlerts(payload)
      
      // Count results
      if (results.telegram || results.discord || results.email) {
        alertsSent++
        console.log(`✅ Sent alert for ${match.token_symbol} to user ${formula.user_id}`)
      }
      
      if (results.telegram === false || results.discord === false || results.email === false) {
        alertsFailed++
      }
    }
    
    console.log(`📊 Alerts summary: ${alertsSent} sent, ${alertsFailed} failed`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      matchesProcessed: recentMatches.length,
      alertsSent,
      alertsFailed,
    })
  } catch (error) {
    console.error('❌ Cron job error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
