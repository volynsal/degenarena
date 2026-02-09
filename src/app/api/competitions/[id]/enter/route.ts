import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { CompetitionEntry, ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/competitions/[id]/enter - Enter a competition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }

  const serviceClient = getServiceClient()

  // Get competition
  const { data: competition, error: compError } = await serviceClient
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()

  if (compError || !competition) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition not found'
    }, { status: 404 })
  }

  // Check if competition is open for entries
  const now = new Date()
  const endsAt = new Date(competition.ends_at)

  if (competition.status === 'completed' || competition.status === 'cancelled') {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition is no longer accepting entries'
    }, { status: 400 })
  }

  if (now > endsAt) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition has ended'
    }, { status: 400 })
  }

  // Check max participants
  if (competition.max_participants && competition.participant_count >= competition.max_participants) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition is full'
    }, { status: 400 })
  }

  // Check tier requirement
  if (competition.tier_requirement) {
    const { data: userXp } = await serviceClient
      .from('user_xp')
      .select('tier, total_xp')
      .eq('user_id', user.id)
      .maybeSingle()

    const tierOrder = ['rookie', 'contender', 'veteran', 'champion', 'legend']
    const userTierIdx = tierOrder.indexOf(userXp?.tier || 'rookie')
    const requiredTierIdx = tierOrder.indexOf(competition.tier_requirement)

    if (userTierIdx < requiredTierIdx) {
      return NextResponse.json<ApiResponse<null>>({
        error: `You need to be ${competition.tier_requirement} tier or higher to enter this competition`
      }, { status: 400 })
    }
  }

  // For live_trading competitions, require Twitch connection
  if (competition.type === 'live_trading') {
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('twitch_url')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.twitch_url) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'You need to connect your Twitch account in Settings to enter Live Trading challenges'
      }, { status: 400 })
    }
  }

  // Check if user already entered
  const { data: existingEntry } = await serviceClient
    .from('competition_entries')
    .select('id')
    .eq('competition_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existingEntry) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You have already entered this competition'
    }, { status: 400 })
  }

  // Get user's current wallet PnL snapshot (starting point)
  let pnlSnapshotStart = 0
  const { data: walletStats } = await serviceClient
    .from('wallet_stats')
    .select('total_pnl_usd')
    .eq('user_id', user.id)
    .maybeSingle()

  if (walletStats) {
    pnlSnapshotStart = walletStats.total_pnl_usd ?? 0
  }

  // Get user's tier for display
  const { data: userXpData } = await serviceClient
    .from('user_xp')
    .select('tier')
    .eq('user_id', user.id)
    .maybeSingle()

  // Create entry
  const { data: entry, error: entryError } = await serviceClient
    .from('competition_entries')
    .insert({
      competition_id: id,
      user_id: user.id,
      pnl_snapshot_start: pnlSnapshotStart,
      user_tier: userXpData?.tier || 'rookie',
      status: 'active',
    })
    .select()
    .single()

  if (entryError) {
    if (entryError.code === '23505') {
      return NextResponse.json<ApiResponse<null>>({
        error: 'You have already entered this competition'
      }, { status: 400 })
    }
    return NextResponse.json<ApiResponse<null>>({
      error: entryError.message
    }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<CompetitionEntry>>({
    data: entry as CompetitionEntry,
    message: 'Successfully entered competition!'
  })
}

// DELETE /api/competitions/[id]/enter - Withdraw from competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }

  const serviceClient = getServiceClient()

  // Get competition to check if withdrawal is allowed
  const { data: competition } = await serviceClient
    .from('competitions')
    .select('status, starts_at')
    .eq('id', id)
    .single()

  if (!competition) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition not found'
    }, { status: 404 })
  }

  // Only allow withdrawal before competition starts
  const now = new Date()
  const startsAt = new Date(competition.starts_at)

  if (now >= startsAt) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Cannot withdraw after competition has started'
    }, { status: 400 })
  }

  // Delete entry
  const { error } = await serviceClient
    .from('competition_entries')
    .delete()
    .eq('competition_id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json<ApiResponse<null>>({
    message: 'Successfully withdrawn from competition'
  })
}
