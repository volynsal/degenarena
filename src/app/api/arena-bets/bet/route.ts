import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/arena-bets/bet - Place a bet on a market
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { market_id, position, amount } = body

  // Validate inputs
  if (!market_id || !position || !amount) {
    return NextResponse.json<ApiResponse<null>>({ error: 'market_id, position, and amount are required' }, { status: 400 })
  }

  if (!['yes', 'no'].includes(position)) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Position must be "yes" or "no"' }, { status: 400 })
  }

  const betAmount = parseInt(amount)
  if (isNaN(betAmount) || betAmount < 10 || betAmount > 5000) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Bet must be between 10 and 5,000 points' }, { status: 400 })
  }

  const serviceClient = getServiceClient()
  const userId = session.user.id

  // Ensure user_points row exists (first-time users get 500 starting points)
  await serviceClient.from('user_points').upsert(
    { user_id: userId, balance: 500 },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  // Check user balance
  const { data: points } = await serviceClient
    .from('user_points')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (!points || points.balance < betAmount) {
    return NextResponse.json<ApiResponse<null>>({ error: `Not enough points. You have ${points?.balance ?? 0} pts.` }, { status: 400 })
  }

  // Check market is active and still open
  const { data: market } = await serviceClient
    .from('arena_markets')
    .select('id, status, resolve_at')
    .eq('id', market_id)
    .maybeSingle()

  if (!market) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Market not found' }, { status: 404 })
  }

  if (market.status !== 'active') {
    return NextResponse.json<ApiResponse<null>>({ error: 'Market is no longer active' }, { status: 400 })
  }

  if (new Date(market.resolve_at) < new Date()) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Market has expired' }, { status: 400 })
  }

  // Check if user already bet on this market
  const { data: existingBet } = await serviceClient
    .from('arena_bets')
    .select('id')
    .eq('market_id', market_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (existingBet) {
    return NextResponse.json<ApiResponse<null>>({ error: 'You already placed a bet on this market' }, { status: 400 })
  }

  // Deduct points
  await serviceClient.from('user_points').update({
    balance: points.balance - betAmount,
    total_wagered: (points as any).total_wagered ? (points as any).total_wagered + betAmount : betAmount,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  // Place bet
  const { data: bet, error } = await serviceClient.from('arena_bets').insert({
    market_id,
    user_id: userId,
    position,
    amount: betAmount,
  }).select().single()

  if (error) {
    // Refund on failure
    await serviceClient.from('user_points').update({
      balance: points.balance,
    }).eq('user_id', userId)
    return NextResponse.json<ApiResponse<null>>({ error: 'Failed to place bet' }, { status: 500 })
  }

  // Update market pool stats
  const poolField = position === 'yes' ? 'yes_pool' : 'no_pool'
  const { data: mkt } = await serviceClient
    .from('arena_markets')
    .select('total_pool, yes_pool, no_pool, total_bettors')
    .eq('id', market_id)
    .maybeSingle()

  if (mkt) {
    await serviceClient.from('arena_markets').update({
      total_pool: (mkt.total_pool ?? 0) + betAmount,
      [poolField]: ((mkt as Record<string, number>)[poolField] ?? 0) + betAmount,
      total_bettors: (mkt.total_bettors ?? 0) + 1,
    }).eq('id', market_id)
  }

  return NextResponse.json({
    data: bet,
    balance: points.balance - betAmount,
    message: `Bet placed! ${betAmount} pts on ${position.toUpperCase()}.`,
  })
}
