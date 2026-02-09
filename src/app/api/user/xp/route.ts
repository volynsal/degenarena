import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { ApiResponse, UserXp } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/user/xp - Get current user's XP, tier, and recent XP events
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = getServiceClient()
  const userId = session.user.id

  // Ensure user_xp row exists
  await serviceClient.from('user_xp').upsert(
    { user_id: userId, total_xp: 0, tier: 'rookie' },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  // Fetch XP data
  const { data: xp } = await serviceClient
    .from('user_xp')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // Fetch recent XP events (last 20)
  const { data: events } = await serviceClient
    .from('xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Calculate progress to next tier
  const tierOrder = ['rookie', 'contender', 'veteran', 'champion', 'legend'] as const
  const thresholds = [0, 100, 500, 2000, 5000]
  const currentTierIdx = tierOrder.indexOf((xp?.tier || 'rookie') as any)
  const nextTierIdx = Math.min(currentTierIdx + 1, tierOrder.length - 1)
  const currentThreshold = thresholds[currentTierIdx]
  const nextThreshold = thresholds[nextTierIdx]
  const isMaxTier = currentTierIdx === tierOrder.length - 1
  const progress = isMaxTier ? 100 : Math.min(100, Math.round(
    ((xp?.total_xp ?? 0) - currentThreshold) / (nextThreshold - currentThreshold) * 100
  ))

  return NextResponse.json({
    data: xp,
    events: events || [],
    progress: {
      current_tier: xp?.tier || 'rookie',
      next_tier: isMaxTier ? null : tierOrder[nextTierIdx],
      xp_current: xp?.total_xp ?? 0,
      xp_for_next: isMaxTier ? null : nextThreshold,
      percent: progress,
    },
  })
}
