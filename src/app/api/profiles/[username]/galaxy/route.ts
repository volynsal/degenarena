import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/profiles/[username]/galaxy - Public Galaxy bet history for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const serviceClient = getServiceClient()

  // Look up user by username
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('username', params.username)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  // Fetch resolved bets only (public view shouldn't expose pending bets)
  const { data: bets, error } = await serviceClient
    .from('arena_bets')
    .select('id, position, amount, payout, is_winner, created_at, market:arena_markets(id, question, token_symbol, market_type, outcome, status, resolved_at)')
    .eq('user_id', profile.id)
    .not('is_winner', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const allBets = bets || []
  const wins = allBets.filter(b => b.is_winner === true)
  const losses = allBets.filter(b => b.is_winner === false)
  const totalWagered = allBets.reduce((sum, b) => sum + (b.amount || 0), 0)
  const totalWon = wins.reduce((sum, b) => sum + (b.payout || 0), 0)

  // Also count total bets (including pending) for the summary
  const { count: totalBets } = await serviceClient
    .from('arena_bets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)

  const { count: pendingCount } = await serviceClient
    .from('arena_bets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .is('is_winner', null)

  return NextResponse.json({
    data: allBets,
    summary: {
      total_bets: totalBets ?? 0,
      wins: wins.length,
      losses: losses.length,
      pending: pendingCount ?? 0,
      win_rate: wins.length + losses.length > 0
        ? Math.round((wins.length / (wins.length + losses.length)) * 100)
        : 0,
      total_wagered: totalWagered,
      total_won: totalWon,
      net_pnl: totalWon - allBets.reduce((sum, b) => sum + (b.amount || 0), 0),
    },
  })
}
