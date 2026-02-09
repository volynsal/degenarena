import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { checkMultipleStreams, extractTwitchUsername } from '@/lib/services/twitch'

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
    liveSessionsTracked: 0,
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
      const userIds = Array.from(new Set(activeEntries.map(e => e.user_id)))

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

    // ── 2b. TRACK LIVE SESSIONS for live_trading competitions ──
    // Check which competition participants are currently streaming on Twitch
    try {
      // Get all users in active live_trading competitions
      const { data: liveEntries } = await supabaseAdmin
        .from('competition_entries')
        .select(`
          id,
          user_id,
          competition_id,
          competitions!inner(status, type)
        `)
        .eq('status', 'active')
        .eq('competitions.status', 'active')
        .eq('competitions.type', 'live_trading')

      if (liveEntries && liveEntries.length > 0) {
        // Get Twitch URLs for these users
        const liveUserIds = Array.from(new Set(liveEntries.map(e => e.user_id)))
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, twitch_url')
          .in('id', liveUserIds)
          .not('twitch_url', 'is', null)

        if (profiles && profiles.length > 0) {
          // Build user_id -> twitch_username mapping
          const userTwitchMap = new Map<string, string>()
          const twitchUsernames: string[] = []
          for (const p of profiles) {
            const twitchUser = extractTwitchUsername(p.twitch_url)
            if (twitchUser) {
              userTwitchMap.set(p.id, twitchUser)
              twitchUsernames.push(twitchUser)
            }
          }

          // Batch check Twitch live status
          const streamStatuses = await checkMultipleStreams(twitchUsernames)

          // For each user: manage their live session
          for (const [userId, twitchUsername] of Array.from(userTwitchMap.entries())) {
            const status = streamStatuses.get(twitchUsername)
            const isLive = status?.isLive || false

            // Find their active competition IDs
            const userCompIds = liveEntries
              .filter(e => e.user_id === userId)
              .map(e => e.competition_id)

            // Check for an existing open session (ended_at IS NULL)
            const { data: openSession } = await supabaseAdmin
              .from('live_sessions')
              .select('id, started_at')
              .eq('user_id', userId)
              .is('ended_at', null)
              .order('started_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (isLive && !openSession) {
              // User just went live — create a new session
              // Use Twitch's started_at if available, otherwise now
              const startedAt = status?.startedAt || now.toISOString()
              for (const compId of userCompIds) {
                await supabaseAdmin.from('live_sessions').insert({
                  user_id: userId,
                  twitch_username: twitchUsername,
                  started_at: startedAt,
                  competition_id: compId,
                })
              }
              results.liveSessionsTracked++
              console.log(`📺 Live session started: ${twitchUsername}`)
            } else if (!isLive && openSession) {
              // User went offline — close the session
              const startedAt = new Date(openSession.started_at)
              const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000)

              await supabaseAdmin
                .from('live_sessions')
                .update({
                  ended_at: now.toISOString(),
                  duration_minutes: Math.max(durationMinutes, 0),
                })
                .eq('id', openSession.id)

              // Also update live_minutes on their competition entries
              for (const compId of userCompIds) {
                // Get total live minutes for this user in this competition
                const { data: comp } = await supabaseAdmin
                  .from('competitions')
                  .select('starts_at, ends_at')
                  .eq('id', compId)
                  .single()

                if (comp) {
                  const { data: totalMins } = await supabaseAdmin.rpc('get_live_minutes', {
                    p_user_id: userId,
                    p_start: comp.starts_at,
                    p_end: comp.ends_at,
                  })

                  await supabaseAdmin
                    .from('competition_entries')
                    .update({ live_minutes: totalMins || 0 })
                    .eq('competition_id', compId)
                    .eq('user_id', userId)
                }
              }

              console.log(`📺 Live session ended: ${twitchUsername} (${durationMinutes}min)`)
            }
            // If isLive && openSession exists: session continues, nothing to do
            // If !isLive && no openSession: user is just offline, nothing to do
          }
        }
      }
    } catch (err) {
      console.error('Live session tracking error:', err)
      results.errors.push(`Live tracking: ${err instanceof Error ? err.message : String(err)}`)
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

    // ── 4. CREATE recurring competitions ──
    // Helper: ensure a competition exists for a given day and type
    const ensureCompetition = async (opts: {
      type: string
      name: string
      description: string
      prizes: Record<string, string>
      point_prizes: Record<string, number>
      startDate: Date
      status: 'upcoming' | 'active'
    }) => {
      const endDate = new Date(opts.startDate)
      endDate.setUTCDate(endDate.getUTCDate() + 1)

      const { data: existing } = await supabaseAdmin
        .from('competitions')
        .select('id')
        .eq('type', opts.type)
        .gte('starts_at', opts.startDate.toISOString())
        .lt('starts_at', endDate.toISOString())
        .maybeSingle()

      if (!existing) {
        const { error: createErr } = await supabaseAdmin
          .from('competitions')
          .insert({
            name: opts.name,
            description: opts.description,
            type: opts.type,
            status: opts.status,
            starts_at: opts.startDate.toISOString(),
            ends_at: endDate.toISOString(),
            prizes: opts.prizes,
            point_prizes: opts.point_prizes,
          })

        if (createErr) {
          console.error(`❌ Failed to create ${opts.type}:`, createErr.message)
          results.errors.push(`Create ${opts.type}: ${createErr.message}`)
        } else {
          results.competitionsCreated++
          console.log(`📅 Created ${opts.type}: ${opts.name} (${opts.status})`)
        }
      }
    }

    // Today's start time (8am UTC today)
    const today = new Date(now)
    today.setUTCHours(8, 0, 0, 0)

    // Tomorrow's start time
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    // Determine if today's comps should be active or upcoming
    const todayStatus = now >= today ? 'active' as const : 'upcoming' as const

    // ── TODAY'S competitions (create if missing) ──
    await ensureCompetition({
      type: 'daily_flip', name: '24-Hour Flip',
      description: 'Best total verified PnL in 24 hours wins. Show what your wallet can do.',
      prizes: { '1st': 'daily_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
      startDate: today, status: todayStatus,
    })

    await ensureCompetition({
      type: 'best_call', name: 'Best Call',
      description: 'One trade, highest % return. Precision over volume.',
      prizes: { '1st': 'sniper_badge', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
      startDate: today, status: todayStatus,
    })

    await ensureCompetition({
      type: 'live_trading', name: 'Live Trading Challenge',
      description: 'Go Live, trade, and let your verified PnL do the talking.',
      prizes: { '1st': 'live_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 750, '2nd': 350, '3rd': 150 },
      startDate: today, status: todayStatus,
    })

    // ── TOMORROW'S competitions (always upcoming) ──
    await ensureCompetition({
      type: 'daily_flip', name: '24-Hour Flip',
      description: 'Best total verified PnL in 24 hours wins. Show what your wallet can do.',
      prizes: { '1st': 'daily_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
      startDate: tomorrow, status: 'upcoming',
    })

    await ensureCompetition({
      type: 'best_call', name: 'Best Call',
      description: 'One trade, highest % return. Precision over volume.',
      prizes: { '1st': 'sniper_badge', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 500, '2nd': 250, '3rd': 100 },
      startDate: tomorrow, status: 'upcoming',
    })

    await ensureCompetition({
      type: 'live_trading', name: 'Live Trading Challenge',
      description: 'Go Live, trade, and let your verified PnL do the talking.',
      prizes: { '1st': 'live_champion', '2nd': 'silver_trophy', '3rd': 'bronze_trophy' },
      point_prizes: { '1st': 750, '2nd': 350, '3rd': 150 },
      startDate: tomorrow, status: 'upcoming',
    })

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
