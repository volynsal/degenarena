import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { claimDailyPoints } from '@/lib/services/arena-bets'
import type { ApiResponse, UserPoints } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/arena-bets/points - Get user's points & stats
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = getServiceClient()

  // Ensure user_points row exists
  await serviceClient.from('user_points').upsert(
    { user_id: session.user.id, balance: 500 },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  const { data: points } = await serviceClient
    .from('user_points')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()

  // Get recent bet history
  const { data: recentBets } = await serviceClient
    .from('arena_bets')
    .select('*, market:arena_markets(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    data: points,
    bets: recentBets || [],
  })
}

// POST /api/arena-bets/points - Claim daily points
export async function POST() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await claimDailyPoints(session.user.id)
  return NextResponse.json(result)
}
