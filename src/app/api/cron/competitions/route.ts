import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Competition management cron job (V2 - PnL-based)
 * - Updates competition statuses (upcoming -> active -> completed)
 * - Snapshots current wallet PnL for active entries
 * - Finalizes ended competitions (rankings, prizes, XP)
 * - Creates recurring daily competitions (24-Hour Flip, Best Call)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    statusUpdates: { started: 0, ended: 0 },
    pnlUpdated: 0,
    competitionsCreated: 0,
    errors: [] as string[],
  }

  try {
    console.log('🏆 Starting competition cron job (V2)...')

    // ── 1. START upcoming competitions that should now be active ──
    const { data: toStart, error: startError } = await supabaseAdmin
      .from('competitions')
      .update({ status: 'active', updated_at: now.toISOString() })
      .eq('status', 'upcoming')
      .lte('starts_at', now.toISOString())
      .select('id, name')

    if (startError) {
      results.errors.push(`Start error: ${startError.message}`)
    } else if (toStart) {
      results.statusUpdates.started = toStart.length
      if (toStart.length > 0) console.log(`▶️ Started ${toStart.length} competitions`)
    }

    // ── 2. UPDATE PnL snapshots for active competition entries ──
    // Get all active entries in active competitions
    const { data: activeEntries, error: entriesError } = await supabaseAdmin
      .from('competition_entries')
      .select(`
        id,
        user_id,
        pnl_snapshot_start,
        competition_id,
        competitions!inner(status, type)
      `)
      .eq('status', 'active')
      .eq('competitions.status', 'active')

    if (entriesError) {
      results.errors.push(`Entries error: ${entriesError.message}`)
    } else if (activeEntries) {
      // Batch: get all unique user IDs and their current wallet PnL
      const userIds = [...new Set(activeEntries.map(e => e.user_id))]

      if (userIds.length > 0) {
        const { data: walletStats } = await supabaseAdmin
          .from('wallet_stats')
          .select('user_id, total_pnl_usd, best_trade_pnl')
          .in('user_id', userIds)

        const pnlMap = new Map(
          (walletStats || []).map(ws => [ws.user_id, ws])
        )

        // Update each entry's PnL delta
        for (const entry of activeEntries) {
          const ws = pnlMap.get(entry.user_id)
          if (!ws) continue

          const currentPnl = ws.total_pnl_usd ?? 0
          const startPnl = entry.pnl_snapshot_start ?? 0
          const pnlDelta = currentPnl - startPnl
          const compType = (entry.competitions as any)?.type

          const updateData: Record<string, any> = {
            pnl_snapshot_end: currentPnl,
            pnl_delta: Math.round(pnlDelta * 100) / 100,
          }

          // For best_call type, also track best single trade return
          if (compType === 'best_call' && ws.best_trade_pnl != null) {
            updateData.best_trade_return = ws.best_trade_pnl
          }

          await supabaseAdmin
            .from('competition_entries')
            .update(updateData)
            .eq('id', entry.id)

          results.pnlUpdated++
        }

        if (results.pnlUpdated > 0) {
          console.log(`📊 Updated PnL for ${results.pnlUpdated} entries`)
        }
      }
    }

    // ── 3. FINALIZE ended competitions ──
    const { data: toEnd, error: endFetchError } = await supabaseAdmin
      .from('competitions')
      .select('id, name, type')
      .eq('status', 'active')
      .lte('ends_at', now.toISOString())

    if (endFetchError) {
      results.errors.push(`End fetch error: ${endFetchError.message}`)
    }

    if (toEnd && toEnd.length > 0) {
      for (const competition of toEnd) {
        console.log(`🏁 Finalizing: ${competition.name}`)

        const { error: finalizeError } = await supabaseAdmin.rpc(
          'finalize_competition',
          { p_competition_id: competition.id }
        )

        if (finalizeError) {
          results.errors.push(`Finalize error for ${competition.name}: ${finalizeError.message}`)

          // Fallback: just mark as completed
          await supabaseAdmin
            .from('competitions')
            .update({ status: 'completed', updated_at: now.toISOString() })
            .eq('id', competition.id)
        }

        results.statusUpdates.ended++
      }
      console.log(`✅ Ended ${results.statusUpdates.ended} competitions`)
    }

    // ── 4. CREATE recurring daily competitions ──
    const tomorrow = new Date(now)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(8, 0, 0, 0) // 8am UTC

    const dayAfter = new Date(tomorrow)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

    // 24-Hour Flip
    const { data: existingFlip } = await supabaseAdmin
      .from('competitions')
      .select('id')
      .eq('type', 'daily_flip')
      .gte('starts_at', tomorrow.toISOString())
      .lt('starts_at', dayAfter.toISOString())
      .maybeSingle()

    if (!existingFlip) {
      const { error: createErr } = await supabaseAdmin
        .from('competitions')
        .insert({
          name: '24-Hour Flip',
          description: 'Best total verified PnL in 24 hours wins. Show what your wallet can do.',
          type: 'daily_flip',
          status: 'upcoming',
          starts_at: tomorrow.toISOString(),
          ends_at: dayAfter.toISOString(),
          prizes: { '1st': 'daily_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
          point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
        })

      if (!createErr) {
        results.competitionsCreated++
        console.log('📅 Created tomorrow\'s 24-Hour Flip')
      }
    }

    // Best Call
    const { data: existingBestCall } = await supabaseAdmin
      .from('competitions')
      .select('id')
      .eq('type', 'best_call')
      .gte('starts_at', tomorrow.toISOString())
      .lt('starts_at', dayAfter.toISOString())
      .maybeSingle()

    if (!existingBestCall) {
      const { error: createErr } = await supabaseAdmin
        .from('competitions')
        .insert({
          name: 'Best Call',
          description: 'One trade, highest % return. Precision over volume.',
          type: 'best_call',
          status: 'upcoming',
          starts_at: tomorrow.toISOString(),
          ends_at: dayAfter.toISOString(),
          prizes: { '1st': 'sniper_badge', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
          point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
        })

      if (!createErr) {
        results.competitionsCreated++
        console.log('📅 Created tomorrow\'s Best Call')
      }
    }

    console.log('🏆 Competition cron complete:', results)

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error('❌ Competition cron error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    }, { status: 500 })
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}
