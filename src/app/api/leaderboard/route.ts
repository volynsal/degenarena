import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { LeaderboardEntry, ApiResponse } from '@/types/database'

// GET /api/leaderboard - Get leaderboard entries
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const timeframe = searchParams.get('timeframe') || '7d'
  const limit = parseInt(searchParams.get('limit') || '50')
  
  // Calculate date range for timeframe
  const now = new Date()
  let startDate: Date | null = null
  
  switch (timeframe) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    // 'all' - no date filter
  }
  
  // For now, use the denormalized stats on formulas
  // In production, you might want to calculate these dynamically based on timeframe
  let query = supabase
    .from('formulas')
    .select(`
      id,
      name,
      user_id,
      is_public,
      win_rate,
      total_matches,
      avg_return,
      profile:profiles(username, avatar_url)
    `)
    .eq('is_public', true)
    .gte('total_matches', 10) // Minimum matches for ranking
    .order('win_rate', { ascending: false })
    .order('total_matches', { ascending: false })
    .limit(limit)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  // Transform to leaderboard entries
  const leaderboard: LeaderboardEntry[] = (data || []).map((formula, index) => ({
    rank: index + 1,
    formula_id: formula.id,
    formula_name: formula.name,
    user_id: formula.user_id,
    username: (formula.profile as any)?.username || 'Unknown',
    avatar_url: (formula.profile as any)?.avatar_url,
    win_rate: formula.win_rate,
    total_matches: formula.total_matches,
    avg_return: formula.avg_return,
    is_public: formula.is_public,
  }))
  
  return NextResponse.json<ApiResponse<LeaderboardEntry[]>>({ 
    data: leaderboard 
  })
}
