import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { fetchWalletPnl, meetsVerificationCriteria } from '@/lib/services/wallet-pnl'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/cron/wallet-stats - Refresh wallet stats for all linked wallets
// Run every 6 hours via cron
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const serviceClient = getServiceClient()
  
  try {
    console.log('🔄 Cron: Starting wallet stats refresh...')
    
    // Get all users with linked wallets
    const { data: walletUsers, error: fetchError } = await serviceClient
      .from('profiles')
      .select('id, wallet_address')
      .not('wallet_address', 'is', null)
    
    if (fetchError || !walletUsers) {
      console.error('Failed to fetch wallet users:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch wallet users' 
      }, { status: 500 })
    }
    
    console.log(`Found ${walletUsers.length} users with linked wallets`)
    
    let refreshed = 0
    let verified = 0
    let failed = 0
    
    // Process each wallet (with delay between to respect rate limits)
    for (const user of walletUsers) {
      if (!user.wallet_address) continue
      
      try {
        const pnlData = await fetchWalletPnl(user.wallet_address)
        
        if (!pnlData) {
          failed++
          continue
        }
        
        const isVerified = meetsVerificationCriteria(pnlData)
        
        // Update verification status
        await serviceClient
          .from('profiles')
          .update({ 
            wallet_verified: isVerified,
            wallet_verified_at: isVerified ? new Date().toISOString() : null,
          })
          .eq('id', user.id)
        
        // Upsert stats
        await serviceClient
          .from('wallet_stats')
          .upsert({
            user_id: user.id,
            wallet_address: user.wallet_address,
            total_pnl_usd: pnlData.totalPnlUsd,
            total_invested_usd: pnlData.totalInvestedUsd,
            total_sold_usd: pnlData.totalSoldUsd,
            realized_pnl_usd: pnlData.realizedPnlUsd,
            unrealized_pnl_usd: pnlData.unrealizedPnlUsd,
            total_tokens_traded: pnlData.totalTokensTraded,
            total_buy_transactions: pnlData.totalBuyTransactions,
            total_sell_transactions: pnlData.totalSellTransactions,
            total_transactions: pnlData.totalTransactions,
            winning_tokens: pnlData.winningTokens,
            losing_tokens: pnlData.losingTokens,
            win_rate: pnlData.winRate,
            pnl_1d: pnlData.pnl1d,
            pnl_7d: pnlData.pnl7d,
            pnl_30d: pnlData.pnl30d,
            best_trade_token: pnlData.bestTradeToken,
            best_trade_pnl: pnlData.bestTradePnl,
            worst_trade_token: pnlData.worstTradeToken,
            worst_trade_pnl: pnlData.worstTradePnl,
            data_source: pnlData.dataSource,
            last_refreshed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        
        refreshed++
        if (isVerified) verified++
        
      } catch (err) {
        console.error(`Failed to refresh wallet for user ${user.id}:`, err)
        failed++
      }
      
      // Rate limit: 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      total_wallets: walletUsers.length,
      refreshed,
      verified,
      failed,
    }
    
    console.log('✅ Wallet stats refresh complete:', summary)
    
    return NextResponse.json(summary)
    
  } catch (err) {
    console.error('Wallet stats cron error:', err)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
