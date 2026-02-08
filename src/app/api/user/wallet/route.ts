import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { fetchWalletPnl, isValidSolanaAddress, meetsVerificationCriteria } from '@/lib/services/wallet-pnl'
import type { ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/user/wallet - Get current user's wallet stats
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const serviceClient = getServiceClient()
  
  // Get profile with wallet info
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('wallet_address, wallet_verified, wallet_verified_at')
    .eq('id', session.user.id)
    .single()
  
  if (!profile?.wallet_address) {
    return NextResponse.json<ApiResponse<null>>({ 
      data: null,
      message: 'No wallet linked' 
    })
  }
  
  // Get cached stats
  const { data: stats } = await serviceClient
    .from('wallet_stats')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()
  
  return NextResponse.json({
    data: {
      wallet_address: profile.wallet_address,
      wallet_verified: profile.wallet_verified,
      wallet_verified_at: profile.wallet_verified_at,
      stats,
    }
  })
}

// POST /api/user/wallet - Link wallet and fetch initial stats
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const serviceClient = getServiceClient()
  
  try {
    const body = await request.json()
    const walletAddress = body.wallet_address?.trim()
    
    if (!walletAddress) {
      // Unlinking wallet
      await serviceClient
        .from('profiles')
        .update({ 
          wallet_address: null, 
          wallet_verified: false, 
          wallet_verified_at: null 
        })
        .eq('id', session.user.id)
      
      // Delete cached stats
      await serviceClient
        .from('wallet_stats')
        .delete()
        .eq('user_id', session.user.id)
      
      return NextResponse.json({ 
        data: null, 
        message: 'Wallet unlinked' 
      })
    }
    
    // Validate address format
    if (!isValidSolanaAddress(walletAddress)) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Invalid Solana wallet address. Must be a valid base58 address (32-44 characters).' 
      }, { status: 400 })
    }
    
    // Check if wallet is already linked to another user
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('id, username')
      .eq('wallet_address', walletAddress)
      .neq('id', session.user.id)
      .maybeSingle()
    
    if (existing) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: `This wallet is already linked to @${existing.username}` 
      }, { status: 400 })
    }
    
    // Save wallet address to profile
    await serviceClient
      .from('profiles')
      .update({ 
        wallet_address: walletAddress,
        wallet_verified: false,
        wallet_verified_at: null,
      })
      .eq('id', session.user.id)
    
    // Fetch PnL data from external API
    const pnlData = await fetchWalletPnl(walletAddress)
    
    if (!pnlData) {
      // Wallet saved but no PnL data available yet
      return NextResponse.json({ 
        data: { 
          wallet_address: walletAddress, 
          wallet_verified: false, 
          stats: null 
        },
        message: 'Wallet linked but no trading data found. Stats will update automatically.' 
      })
    }
    
    // Check if meets verification criteria
    const isVerified = meetsVerificationCriteria(pnlData)
    
    // Update verification status
    if (isVerified) {
      await serviceClient
        .from('profiles')
        .update({ 
          wallet_verified: true, 
          wallet_verified_at: new Date().toISOString() 
        })
        .eq('id', session.user.id)
    }
    
    // Upsert wallet stats
    const statsRow = {
      user_id: session.user.id,
      wallet_address: walletAddress,
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
    }
    
    await serviceClient
      .from('wallet_stats')
      .upsert(statsRow, { onConflict: 'user_id' })
    
    return NextResponse.json({ 
      data: {
        wallet_address: walletAddress,
        wallet_verified: isVerified,
        stats: statsRow,
      },
      message: isVerified 
        ? 'Wallet verified! Your trading stats are now public.' 
        : 'Wallet linked. Need more trading history for verification (10+ trades, 3+ tokens).'
    })
    
  } catch (e) {
    console.error('Wallet link error:', e)
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Failed to process wallet' 
    }, { status: 500 })
  }
}

// PATCH /api/user/wallet - Manually refresh wallet stats
export async function PATCH() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const serviceClient = getServiceClient()
  
  // Get current wallet
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('wallet_address')
    .eq('id', session.user.id)
    .single()
  
  if (!profile?.wallet_address) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'No wallet linked' 
    }, { status: 400 })
  }
  
  // Check rate limit (max 1 refresh per 5 minutes)
  const { data: existingStats } = await serviceClient
    .from('wallet_stats')
    .select('last_refreshed_at')
    .eq('user_id', session.user.id)
    .maybeSingle()
  
  if (existingStats?.last_refreshed_at) {
    const lastRefresh = new Date(existingStats.last_refreshed_at)
    const minutesSince = (Date.now() - lastRefresh.getTime()) / 60000
    if (minutesSince < 5) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: `Please wait ${Math.ceil(5 - minutesSince)} minutes before refreshing again` 
      }, { status: 429 })
    }
  }
  
  // Fetch fresh data
  const pnlData = await fetchWalletPnl(profile.wallet_address)
  
  if (!pnlData) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Could not fetch wallet data. Try again later.' 
    }, { status: 502 })
  }
  
  // Update verification
  const isVerified = meetsVerificationCriteria(pnlData)
  
  await serviceClient
    .from('profiles')
    .update({ 
      wallet_verified: isVerified,
      wallet_verified_at: isVerified ? new Date().toISOString() : null,
    })
    .eq('id', session.user.id)
  
  // Upsert stats
  const statsRow = {
    user_id: session.user.id,
    wallet_address: profile.wallet_address,
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
  }
  
  await serviceClient
    .from('wallet_stats')
    .upsert(statsRow, { onConflict: 'user_id' })
  
  return NextResponse.json({ 
    data: {
      wallet_verified: isVerified,
      stats: statsRow,
    },
    message: 'Wallet stats refreshed!' 
  })
}
