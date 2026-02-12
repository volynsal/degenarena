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

// GET /api/arena-bets/history - Get user's bet history with market details
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = getServiceClient()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const filter = searchParams.get('filter') || 'all' // all | won | lost | pending

  let query = serviceClient
    .from('arena_bets')
    .select('*, market:arena_markets(*)', { count: 'exact' })
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply outcome filters
  if (filter === 'won') {
    query = query.eq('is_winner', true)
  } else if (filter === 'lost') {
    query = query.eq('is_winner', false)
  } else if (filter === 'pending') {
    query = query.is('is_winner', null)
  }

  const { data: bets, error, count } = await query

  if (error) {
    return NextResponse.json<ApiResponse<null>>({ error: error.message }, { status: 500 })
  }

  // Compute summary stats
  const allBets = bets || []
  const resolved = allBets.filter(b => b.is_winner !== null)
  const wins = resolved.filter(b => b.is_winner === true)
  const losses = resolved.filter(b => b.is_winner === false)
  const totalWagered = allBets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalWon = wins.reduce((sum, b) => sum + (b.payout || 0), 0)
  const netPnl = totalWon - resolved.reduce((sum, b) => sum + (b.amount || 0), 0)

  return NextResponse.json({
    data: allBets,
    total: count ?? allBets.length,
    summary: {
      total_bets: count ?? allBets.length,
      wins: wins.length,
      losses: losses.length,
      pending: allBets.filter(b => b.is_winner === null).length,
      total_wagered: totalWagered,
      total_won: totalWon,
      net_pnl: netPnl,
    },
  })
}
