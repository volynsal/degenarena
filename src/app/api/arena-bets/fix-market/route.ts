import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const SOLO_MARKET_BONUS = 50

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * POST /api/arena-bets/fix-market
 * 
 * Admin endpoint to fix a wrongly resolved market.
 * Reverses all payouts/stats and re-distributes with the correct outcome.
 * 
 * Auth: Either Bearer <CRON_SECRET> OR logged-in admin user (is_admin=true)
 * Body: { market_id: string, correct_outcome: 'yes' | 'no' }
 */
export async function POST(request: NextRequest) {
  // Auth option 1: CRON_SECRET header
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  let authorized = cronSecret && authHeader === `Bearer ${cronSecret}`

  // Auth option 2: Logged-in admin user
  if (!authorized) {
    const userSupabase = await createServerClient()
    const { data: { user } } = await userSupabase.auth.getUser()
    if (user) {
      const serviceClient = getServiceClient()
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      authorized = profile?.is_admin === true
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized — admin access required' }, { status: 401 })
  }

  const body = await request.json()
  const { market_id, correct_outcome } = body

  if (!market_id || !['yes', 'no'].includes(correct_outcome)) {
    return NextResponse.json(
      { error: 'Required: market_id (string), correct_outcome ("yes" or "no")' },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  // ── 1. Fetch market ──
  const { data: market, error: marketErr } = await supabase
    .from('arena_markets')
    .select('*')
    .eq('id', market_id)
    .single()

  if (marketErr || !market) {
    return NextResponse.json({ error: 'Market not found', details: marketErr }, { status: 404 })
  }

  if (market.status !== 'resolved') {
    return NextResponse.json(
      { error: `Market status is "${market.status}", not "resolved". Can only fix resolved markets.` },
      { status: 400 }
    )
  }

  if (market.outcome === correct_outcome) {
    return NextResponse.json(
      { error: `Market already has outcome "${correct_outcome}". Nothing to fix.` },
      { status: 400 }
    )
  }

  const oldOutcome = market.outcome
  console.log(`🔧 Fixing market ${market_id} (${market.question})`)
  console.log(`   Flipping outcome: "${oldOutcome}" → "${correct_outcome}"`)

  // ── 2. Fetch all bets ──
  const { data: bets, error: betsErr } = await supabase
    .from('arena_bets')
    .select('*')
    .eq('market_id', market_id)

  if (betsErr || !bets?.length) {
    return NextResponse.json({ error: 'No bets found for this market', details: betsErr }, { status: 404 })
  }

  console.log(`   Found ${bets.length} bets to reverse`)

  // ── 3. REVERSE all existing payouts ──
  const reversals: any[] = []

  for (const bet of bets) {
    if (bet.is_winner === true) {
      // Wrong winner: take back payout, undo win stats
      const payoutToReverse = bet.payout || 0
      
      // Debit balance (credit_arena_points with p_is_win=false just adjusts balance)
      if (payoutToReverse > 0) {
        await supabase.rpc('credit_arena_points', {
          p_user_id: bet.user_id,
          p_amount: -payoutToReverse,
          p_is_win: false,
        })
      }

      // Undo win_count, total_won, total_earned
      const { data: pts } = await supabase
        .from('user_points')
        .select('win_count, total_won, total_earned')
        .eq('user_id', bet.user_id)
        .single()

      if (pts) {
        await supabase
          .from('user_points')
          .update({
            win_count: Math.max(0, (pts.win_count || 0) - 1),
            total_won: Math.max(0, (pts.total_won || 0) - payoutToReverse),
            total_earned: Math.max(0, (pts.total_earned || 0) - payoutToReverse),
          })
          .eq('user_id', bet.user_id)
      }

      reversals.push({ user_id: bet.user_id, position: bet.position, was: 'winner', reversed: -payoutToReverse })

    } else if (bet.is_winner === false) {
      // Wrong loser: undo loss_count
      const { data: pts } = await supabase
        .from('user_points')
        .select('loss_count')
        .eq('user_id', bet.user_id)
        .single()

      if (pts) {
        await supabase
          .from('user_points')
          .update({ loss_count: Math.max(0, (pts.loss_count || 0) - 1) })
          .eq('user_id', bet.user_id)
      }

      reversals.push({ user_id: bet.user_id, position: bet.position, was: 'loser', reversed: 0 })
    }

    // Reset bet to neutral
    await supabase
      .from('arena_bets')
      .update({ payout: 0, is_winner: null })
      .eq('id', bet.id)
  }

  console.log(`   ✅ Reversed ${reversals.length} payouts`)

  // ── 4. Update market outcome ──
  await supabase
    .from('arena_markets')
    .update({
      outcome: correct_outcome,
      market_data: {
        ...(market.market_data || {}),
        fix_applied: true,
        fix_timestamp: new Date().toISOString(),
        original_outcome: oldOutcome,
        corrected_outcome: correct_outcome,
      },
    })
    .eq('id', market_id)

  // ── 5. Re-distribute with correct outcome (same logic as distributePayouts) ──
  const winnerBets = bets.filter(b => b.position === correct_outcome)
  const loserBets = bets.filter(b => b.position !== correct_outcome)
  const loserPool = loserBets.reduce((sum, b) => sum + b.amount, 0)
  const winnerPool = winnerBets.reduce((sum, b) => sum + b.amount, 0)

  const newPayouts: any[] = []

  if (winnerBets.length === 0) {
    // Nobody bet on the correct outcome — apply solo penalty to all
    for (const bet of bets) {
      const payout = Math.max(bet.amount - SOLO_MARKET_BONUS, 0)
      await supabase.rpc('credit_arena_points', { p_user_id: bet.user_id, p_amount: payout, p_is_win: false })
      await supabase.from('arena_bets').update({ payout, is_winner: false }).eq('id', bet.id)
      await supabase.rpc('update_arena_streak', { p_user_id: bet.user_id, p_is_win: false })
      newPayouts.push({ user_id: bet.user_id, position: bet.position, result: 'loser', payout })
    }
  } else if (loserPool === 0) {
    // Everyone bet correctly — apply solo bonus
    for (const bet of winnerBets) {
      const payout = bet.amount + SOLO_MARKET_BONUS
      await supabase.from('arena_bets').update({ payout, is_winner: true }).eq('id', bet.id)
      await supabase.rpc('credit_arena_points', { p_user_id: bet.user_id, p_amount: payout, p_is_win: true })
      newPayouts.push({ user_id: bet.user_id, position: bet.position, result: 'winner', payout })
    }
  } else {
    // Normal pari-mutuel: losers' pool split among winners proportionally
    for (const bet of winnerBets) {
      const share = bet.amount / winnerPool
      const payout = Math.round(bet.amount + (loserPool * share))
      await supabase.from('arena_bets').update({ payout, is_winner: true }).eq('id', bet.id)
      await supabase.rpc('credit_arena_points', { p_user_id: bet.user_id, p_amount: payout, p_is_win: true })
      newPayouts.push({ user_id: bet.user_id, position: bet.position, result: 'winner', payout })
    }
    for (const bet of loserBets) {
      await supabase.from('arena_bets').update({ payout: 0, is_winner: false }).eq('id', bet.id)
      await supabase.rpc('update_arena_streak', { p_user_id: bet.user_id, p_is_win: false })
      newPayouts.push({ user_id: bet.user_id, position: bet.position, result: 'loser', payout: 0 })
    }
  }

  console.log(`   ✅ Re-distributed: ${winnerBets.length} winners, ${loserBets.length} losers`)

  return NextResponse.json({
    success: true,
    market_id,
    question: market.question,
    old_outcome: oldOutcome,
    new_outcome: correct_outcome,
    total_bets: bets.length,
    reversals,
    new_payouts: newPayouts,
  })
}
