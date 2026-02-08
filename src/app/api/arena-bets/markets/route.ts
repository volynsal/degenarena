import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, ArenaMarket } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/arena-bets/markets - List markets with optional filters
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = getServiceClient()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'active'
  const marketType = searchParams.get('type')
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = serviceClient
    .from('arena_markets')
    .select('*')
    .eq('status', status)
    .order('pinned', { ascending: false, nullsFirst: false })
    .order(status === 'active' ? 'resolve_at' : 'resolved_at', { ascending: status === 'active' })
    .range(offset, offset + limit - 1)

  if (marketType) {
    query = query.eq('market_type', marketType)
  }

  const { data: markets, error } = await query

  if (error) {
    return NextResponse.json<ApiResponse<null>>({ error: error.message }, { status: 500 })
  }

  // Attach user's bet for each market (if any)
  if (markets?.length) {
    const marketIds = markets.map(m => m.id)
    const { data: userBets } = await serviceClient
      .from('arena_bets')
      .select('*')
      .eq('user_id', session.user.id)
      .in('market_id', marketIds)

    const betMap = new Map((userBets || []).map(b => [b.market_id, b]))

    for (const market of markets) {
      (market as any).user_bet = betMap.get(market.id) || null
      ;(market as any).time_remaining = Math.max(0, new Date(market.resolve_at).getTime() - Date.now())
    }
  }

  // Get user's points balance
  const { data: points } = await serviceClient
    .from('user_points')
    .select('balance')
    .eq('user_id', session.user.id)
    .maybeSingle()

  return NextResponse.json({
    data: markets || [],
    balance: points?.balance ?? 500,
    total: markets?.length || 0,
  })
}
