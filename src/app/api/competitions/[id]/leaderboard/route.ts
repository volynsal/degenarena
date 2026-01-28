import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CompetitionLeaderboardEntry, ApiResponse } from '@/types/database'

// GET /api/competitions/[id]/leaderboard - Get competition leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  
  // Get competition to check status
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('id, status')
    .eq('id', id)
    .single()
  
  if (compError || !competition) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition not found' 
    }, { status: 404 })
  }
  
  // Get all entries with user and formula info
  const { data: entries, error } = await supabase
    .from('competition_entries')
    .select(`
      id,
      user_id,
      formula_id,
      total_matches,
      wins,
      total_return,
      avg_return,
      final_rank,
      prize_awarded,
      status,
      profile:profiles(username, avatar_url),
      formula:formulas(name)
    `)
    .eq('competition_id', id)
    .eq('status', 'active')
    .order('total_return', { ascending: false })
    .order('wins', { ascending: false })
    .order('avg_return', { ascending: false })
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  // Transform to leaderboard entries
  const leaderboard: CompetitionLeaderboardEntry[] = (entries || []).map((entry, index) => ({
    rank: entry.final_rank || index + 1,
    entry_id: entry.id,
    user_id: entry.user_id,
    username: (entry.profile as any)?.username || 'Unknown',
    avatar_url: (entry.profile as any)?.avatar_url,
    formula_name: (entry.formula as any)?.name || 'Unknown Formula',
    total_matches: entry.total_matches,
    wins: entry.wins,
    total_return: entry.total_return,
    avg_return: entry.avg_return,
    prize_awarded: entry.prize_awarded,
  }))
  
  return NextResponse.json<ApiResponse<CompetitionLeaderboardEntry[]>>({ 
    data: leaderboard 
  })
}
