import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Competition, ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/competitions/[id] - Get single competition details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  const serviceClient = getServiceClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get competition
  const { data: competition, error } = await serviceClient
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !competition) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Competition not found'
    }, { status: 404 })
  }

  // Get user's entry if logged in
  let myEntry = null
  if (user) {
    const { data: entry } = await serviceClient
      .from('competition_entries')
      .select('*')
      .eq('competition_id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    myEntry = entry
  }

  // Add computed fields
  const now = new Date()
  const startsAt = new Date(competition.starts_at)
  const endsAt = new Date(competition.ends_at)

  let live_status: 'upcoming' | 'live' | 'ended'
  if (now < startsAt) {
    live_status = 'upcoming'
  } else if (now > endsAt) {
    live_status = 'ended'
  } else {
    live_status = 'live'
  }

  const enrichedCompetition = {
    ...competition,
    live_status,
    seconds_remaining: Math.max(0, (endsAt.getTime() - now.getTime()) / 1000),
    my_entry: myEntry,
  }

  return NextResponse.json<ApiResponse<Competition>>({
    data: enrichedCompetition as Competition
  })
}
