import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'
import { DexScreenerService } from '@/lib/services/dexscreener'
import { alertService, type AlertPayload } from '@/lib/services/alerts'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST /api/formulas/[id]/scan - Trigger immediate scan for a formula
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Get the formula
  const { data: formula, error: formulaError } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (formulaError || !formula) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula not found'
    }, { status: 404 })
  }
  
  if (!formula.is_active) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula is not active'
    }, { status: 400 })
  }
  
  try {
    // Fetch new tokens from DexScreener
    const dexService = new DexScreenerService()
    const tokens = await dexService.getNewTokens('solana')
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json<ApiResponse<{ matches: number }>>({
        data: { matches: 0 },
        message: 'No new tokens found'
      })
    }
    
    // Create admin client for inserting matches
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    let matchCount = 0
    
    // Check each token against the formula
    for (const token of tokens) {
      const isMatch = dexService.checkFormulaMatch(token, {
        liquidity_min: formula.liquidity_min,
        liquidity_max: formula.liquidity_max,
        volume_24h_min: formula.volume_24h_min,
        holders_min: formula.holders_min,
        holders_max: formula.holders_max,
        token_age_max_hours: formula.token_age_max_hours,
        require_verified_contract: formula.require_verified_contract,
      })
      
      if (isMatch) {
        // Check if we already have this match
        const { data: existingMatch } = await adminClient
          .from('token_matches')
          .select('id')
          .eq('formula_id', formula.id)
          .eq('token_address', token.baseToken.address)
          .single()
        
        if (!existingMatch) {
          // Insert new match
          const { data: newMatch } = await adminClient
            .from('token_matches')
            .insert({
              formula_id: formula.id,
              token_address: token.baseToken.address,
              token_name: token.baseToken.name,
              token_symbol: token.baseToken.symbol,
              chain: 'solana',
              price_at_match: parseFloat(token.priceUsd || '0'),
              liquidity: token.liquidity?.usd || 0,
              volume_24h: token.volume?.h24 || 0,
              holders: null, // DexScreener doesn't provide this directly
              market_cap: token.fdv || null,
              dexscreener_url: token.url,
              contract_verified: true,
            })
            .select()
            .single()
          
          matchCount++
          
          // Send immediate alert
          if (newMatch) {
            try {
              const alertPayload: AlertPayload = {
                userId: formula.user_id,
                formulaId: formula.id,
                formulaName: formula.name,
                matchId: newMatch.id,
                tokenSymbol: token.baseToken.symbol,
                tokenName: token.baseToken.name,
                tokenAddress: token.baseToken.address,
                chain: 'solana',
                price: parseFloat(token.priceUsd || '0'),
                liquidity: token.liquidity?.usd || 0,
                volume24h: token.volume?.h24 || 0,
                dexscreenerUrl: token.url || '',
              }
              
              await alertService.sendMatchAlerts(alertPayload)
            } catch (alertError) {
              console.error('Error sending immediate alert:', alertError)
            }
          }
        }
      }
    }
    
    return NextResponse.json<ApiResponse<{ matches: number }>>({
      data: { matches: matchCount },
      message: matchCount > 0 
        ? `Found ${matchCount} matching token(s)!` 
        : 'No matching tokens found'
    })
    
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to scan for tokens'
    }, { status: 500 })
  }
}
