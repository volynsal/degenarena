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

  // Safe JSON parsing
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json<ApiResponse<null>>({ error: 'Invalid request body' }, { status: 400 })
  }

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

  // Use atomic RPC function to place bet
  // This handles balance check, deduction, bet insertion, and pool update
  // in a single database transaction (no race conditions).
  const { data: result, error: rpcError } = await serviceClient.rpc('place_arena_bet', {
    p_user_id: userId,
    p_market_id: market_id,
    p_position: position,
    p_amount: betAmount,
  })

  if (rpcError) {
    console.error('place_arena_bet RPC error:', rpcError)
    return NextResponse.json<ApiResponse<null>>({ error: 'Failed to place bet' }, { status: 500 })
  }

  if (!result?.success) {
    const statusCode = result?.error?.includes('not found') ? 404 : 400
    return NextResponse.json<ApiResponse<null>>({ error: result?.error || 'Failed to place bet' }, { status: statusCode })
  }

  return NextResponse.json({
    data: { id: result.bet_id, market_id, position, amount: betAmount },
    balance: result.new_balance,
    message: `Bet placed! ${betAmount} pts on ${position.toUpperCase()}.`,
  })
}
