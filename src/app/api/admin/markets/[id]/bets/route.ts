import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** GET /api/admin/markets/[id]/bets — Get all bets for a market (admin only) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: marketId } = await params

  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Fetch bets with usernames
  const { data: bets, error } = await service
    .from('arena_bets')
    .select('id, user_id, position, amount, payout, is_winner, created_at')
    .eq('market_id', marketId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bets', details: error }, { status: 500 })
  }

  // Enrich with usernames
  if (bets?.length) {
    const userIds = [...new Set(bets.map(b => b.user_id))]
    const { data: profiles } = await service
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const usernameMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

    const enrichedBets = bets.map(b => ({
      ...b,
      username: usernameMap.get(b.user_id) || null,
    }))

    return NextResponse.json({ bets: enrichedBets })
  }

  return NextResponse.json({ bets: bets || [] })
}
