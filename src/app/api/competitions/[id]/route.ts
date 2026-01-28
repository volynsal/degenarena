import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Competition, ApiResponse } from '@/types/database'

// GET /api/competitions/[id] - Get single competition details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get competition
  const { data: competition, error } = await supabase
    .from('competitions')
    .select(`
      *,
      challenger:profiles!competitions_challenger_id_fkey(id, username, avatar_url),
      challenged:profiles!competitions_challenged_id_fkey(id, username, avatar_url)
    `)
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
    const { data: entry } = await supabase
      .from('competition_entries')
      .select(`
        *,
        formula:formulas(id, name)
      `)
      .eq('competition_id', id)
      .eq('user_id', user.id)
      .single()
    
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
