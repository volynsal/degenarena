import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { alertService, type DigestPayload, type DigestFormula, type DigestMatch } from '@/lib/services/alerts'

// Service role client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// This endpoint sends digest alerts for new matches
// Groups all matches by user and sends ONE email per user

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    console.log('📨 Cron job: Sending digest alerts for new matches...')
    
    // Get matches from last 24 hours that haven't been alerted
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
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
      .gte('matched_at', oneDayAgo)
      .order('matched_at', { ascending: false })
    
    if (!recentMatches || recentMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No new matches to alert',
        digestsSent: 0,
      })
    }
    
    // Filter out matches that already have alerts
    const matchesNeedingAlerts: typeof recentMatches = []
    
    for (const match of recentMatches) {
      const { data: existingAlerts } = await supabaseAdmin
        .from('alerts')
        .select('id')
        .eq('token_match_id', match.id)
        .limit(1)
      
      if (!existingAlerts || existingAlerts.length === 0) {
        matchesNeedingAlerts.push(match)
      }
    }
    
    if (matchesNeedingAlerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All matches already alerted',
        digestsSent: 0,
      })
    }
    
    // Group matches by user
    const userDigests = new Map<string, DigestPayload>()
    
    for (const match of matchesNeedingAlerts) {
      const formula = match.formula as any
      if (!formula) continue
      
      const userId = formula.user_id
      
      if (!userDigests.has(userId)) {
        userDigests.set(userId, {
          userId,
          formulas: [],
          totalMatches: 0,
        })
      }
      
      const digest = userDigests.get(userId)!
      
      // Find or create formula entry
      let formulaEntry = digest.formulas.find(f => f.formulaId === formula.id)
      if (!formulaEntry) {
        formulaEntry = {
          formulaId: formula.id,
          formulaName: formula.name,
          matches: [],
        }
        digest.formulas.push(formulaEntry)
      }
      
      // Add match to formula
      formulaEntry.matches.push({
        tokenSymbol: match.token_symbol,
        tokenName: match.token_name,
        tokenAddress: match.token_address,
        chain: match.chain,
        price: match.price_at_match,
        liquidity: match.liquidity || 0,
        volume24h: match.volume_24h || 0,
        dexscreenerUrl: match.dexscreener_url || '',
        matchId: match.id,
        matchedAt: match.matched_at,
      })
      
      digest.totalMatches++
    }
    
    // Send digest to each user
    let digestsSent = 0
    let digestsFailed = 0
    
    for (const [userId, digest] of Array.from(userDigests.entries())) {
      console.log(`📧 Sending digest to user ${userId}: ${digest.totalMatches} matches across ${digest.formulas.length} formulas`)
      
      const result = await alertService.sendDigestAlerts(digest)
      
      if (result.email) {
        digestsSent++
        console.log(`✅ Digest sent to user ${userId}`)
        
        // Mark all matches as alerted
        for (const formula of digest.formulas) {
          for (const match of formula.matches) {
            await supabaseAdmin
              .from('alerts')
              .insert({
                user_id: userId,
                formula_id: formula.formulaId,
                token_match_id: match.matchId,
                type: 'email',
                status: 'sent',
                sent_at: new Date().toISOString(),
              })
          }
        }
      } else {
        digestsFailed++
        console.log(`❌ Failed to send digest to user ${userId}`)
      }
    }
    
    console.log(`📊 Digest summary: ${digestsSent} sent, ${digestsFailed} failed`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalMatches: matchesNeedingAlerts.length,
      usersNotified: userDigests.size,
      digestsSent,
      digestsFailed,
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
