import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { tokenMonitor } from '@/lib/services/token-monitor'

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint updates price returns for matches at 1h, 24h, and 7d intervals
// Also tracks max prices for calculating accurate returns
// Should be called every 15-30 minutes by a cron job for accurate max price tracking

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    console.log('📈 Cron job: Updating match returns...')
    
    const now = Date.now()
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString()
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const updates = {
      oneHour: 0,
      twentyFourHour: 0,
      sevenDay: 0,
      maxPriceUpdates: 0,
      errors: 0,
    }
    
    // =============================================
    // TRACK MAX PRICES (for all matches < 24h old)
    // =============================================
    const { data: recentMatches } = await supabaseAdmin
      .from('token_matches')
      .select('id, token_address, price_at_match, price_high_24h, price_high_exit, matched_at, formula:formulas(exit_hours)')
      .gte('matched_at', twentyFourHoursAgo)
      .limit(100)
    
    for (const match of recentMatches || []) {
      try {
        const currentPrice = await tokenMonitor.getTokenPrice(match.token_address)
        if (!currentPrice) continue
        
        const updateData: Record<string, number> = {}
        
        // Track 24h high (for all matches)
        const currentHigh24h = match.price_high_24h || match.price_at_match
        if (currentPrice > currentHigh24h) {
          updateData.price_high_24h = currentPrice
          updateData.return_max_24h = ((currentPrice - match.price_at_match) / match.price_at_match) * 100
        }
        
        // Track exit window high (for preset formulas)
        const exitHours = (match.formula as any)?.exit_hours
        if (exitHours) {
          // Only track during exit window
          const matchedAt = new Date(match.matched_at || now).getTime()
          const exitWindowEnd = matchedAt + (exitHours * 60 * 60 * 1000)
          
          if (now <= exitWindowEnd) {
            const currentHighExit = match.price_high_exit || match.price_at_match
            if (currentPrice > currentHighExit) {
              updateData.price_high_exit = currentPrice
              updateData.return_max_exit = ((currentPrice - match.price_at_match) / match.price_at_match) * 100
            }
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin
            .from('token_matches')
            .update({ ...updateData, last_price_check: new Date().toISOString() })
            .eq('id', match.id)
          updates.maxPriceUpdates++
        }
      } catch (e) {
        updates.errors++
      }
    }
    
    // =============================================
    // SNAPSHOT PRICES AT SPECIFIC INTERVALS
    // =============================================
    
    // Get matches needing 1h update (matched ~1 hour ago, no 1h price yet)
    const { data: matches1h } = await supabaseAdmin
      .from('token_matches')
      .select('id, token_address, price_at_match')
      .lte('matched_at', oneHourAgo)
      .is('price_1h', null)
      .limit(50)
    
    for (const match of matches1h || []) {
      try {
        const currentPrice = await tokenMonitor.getTokenPrice(match.token_address)
        if (currentPrice) {
          await tokenMonitor.updateMatchReturns(match.id, currentPrice, match.price_at_match, '1h')
          updates.oneHour++
        }
      } catch (e) {
        updates.errors++
      }
    }
    
    // Get matches needing 24h update
    const { data: matches24h } = await supabaseAdmin
      .from('token_matches')
      .select('id, token_address, price_at_match')
      .lte('matched_at', twentyFourHoursAgo)
      .is('price_24h', null)
      .limit(50)
    
    for (const match of matches24h || []) {
      try {
        const currentPrice = await tokenMonitor.getTokenPrice(match.token_address)
        if (currentPrice) {
          await tokenMonitor.updateMatchReturns(match.id, currentPrice, match.price_at_match, '24h')
          updates.twentyFourHour++
        }
      } catch (e) {
        updates.errors++
      }
    }
    
    // Get matches needing 7d update
    const { data: matches7d } = await supabaseAdmin
      .from('token_matches')
      .select('id, token_address, price_at_match')
      .lte('matched_at', sevenDaysAgo)
      .is('price_7d', null)
      .limit(50)
    
    for (const match of matches7d || []) {
      try {
        const currentPrice = await tokenMonitor.getTokenPrice(match.token_address)
        if (currentPrice) {
          await tokenMonitor.updateMatchReturns(match.id, currentPrice, match.price_at_match, '7d')
          updates.sevenDay++
        }
      } catch (e) {
        updates.errors++
      }
    }
    
    console.log('📊 Return updates:', updates)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updates,
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
