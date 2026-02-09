import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { CompetitionLeaderboardEntry, ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/competitions/[id]/leaderboard - Get competition leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const serviceClient = getServiceClient()

  // Get competition to determine ranking method
  const { data: competition, error: compError } = await serviceClient
    .from('competitions')
    .select('id, status, type')
    .eq('id', id)
    .single()

  if (compError || !competition) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition not found'
    }, { status: 404 })
  }

  // Determine sort order based on type
  const isBestCall = competition.type === 'best_call'

  // Get all entries with user info
  let query = serviceClient
    .from('competition_entries')
    .select(`
      id,
      user_id,
      pnl_delta,
      best_trade_return,
      eliminated_round,
      final_rank,
      prize_awarded,
      user_tier,
      live_minutes,
      status,
      profile:profiles(username, avatar_url)
    `)
    .eq('competition_id', id)
    .eq('status', 'active')

  // Sort by the appropriate metric
  if (isBestCall) {
    query = query
      .order('best_trade_return', { ascending: false, nullsFirst: false })
      .order('pnl_delta', { ascending: false, nullsFirst: false })
  } else {
    query = query
      .order('pnl_delta', { ascending: false, nullsFirst: false })
      .order('best_trade_return', { ascending: false, nullsFirst: false })
  }

  const { data: entries, error } = await query

  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }

  // Transform to leaderboard entries
  const leaderboard: CompetitionLeaderboardEntry[] = (entries || []).map((entry, index) => ({
    rank: entry.final_rank || index + 1,
    entry_id: entry.id,
    user_id: entry.user_id,
    username: (entry.profile as any)?.username || 'Unknown',
    avatar_url: (entry.profile as any)?.avatar_url,
    tier: entry.user_tier,
    pnl_delta: entry.pnl_delta ?? 0,
    best_trade_return: entry.best_trade_return,
    eliminated_round: entry.eliminated_round,
    final_rank: entry.final_rank,
    prize_awarded: entry.prize_awarded,
    live_minutes: entry.live_minutes ?? 0,
  }))

  return NextResponse.json<ApiResponse<CompetitionLeaderboardEntry[]>>({
    data: leaderboard
  })
}
