import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface UserStats {
  total_formulas: number
  active_formulas: number
  total_matches: number
  overall_win_rate: number
  overall_avg_return: number
  best_formula: {
    id: string
    name: string
    win_rate: number
  } | null
  leaderboard_rank: number | null
}

// GET /api/user/stats - Get current user's stats
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  // Get user's formulas
  const { data: formulas } = await supabase
    .from('formulas')
    .select('id, name, is_active, win_rate, total_matches, avg_return')
    .eq('user_id', session.user.id)
  
  if (!formulas || formulas.length === 0) {
    const stats: UserStats = {
      total_formulas: 0,
      active_formulas: 0,
      total_matches: 0,
      overall_win_rate: 0,
      overall_avg_return: 0,
      best_formula: null,
      leaderboard_rank: null,
    }
    
    return NextResponse.json<ApiResponse<UserStats>>({ data: stats })
  }
  
  // Calculate aggregated stats
  const activeFormulas = formulas.filter(f => f.is_active)
  const totalMatches = formulas.reduce((sum, f) => sum + f.total_matches, 0)
  
  // Weighted average for win rate (by total matches)
  const weightedWinRate = totalMatches > 0
    ? formulas.reduce((sum, f) => sum + (f.win_rate * f.total_matches), 0) / totalMatches
    : 0
  
  // Weighted average for returns (by total matches)
  const weightedReturn = totalMatches > 0
    ? formulas.reduce((sum, f) => sum + (f.avg_return * f.total_matches), 0) / totalMatches
    : 0
  
  // Best formula by win rate (with minimum matches)
  const qualifiedFormulas = formulas.filter(f => f.total_matches >= 5)
  const bestFormula = qualifiedFormulas.length > 0
    ? qualifiedFormulas.reduce((best, f) => f.win_rate > best.win_rate ? f : best)
    : null
  
  // Get leaderboard rank (if user has a public formula with 10+ matches)
  let leaderboardRank: number | null = null
  
  const { data: publicFormulas } = await supabase
    .from('formulas')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('is_public', true)
    .gte('total_matches', 10)
    .order('win_rate', { ascending: false })
    .limit(1)
  
  if (publicFormulas && publicFormulas.length > 0) {
    // Count how many formulas rank higher
    const bestPublicFormula = publicFormulas[0]
    const { data: bestStats } = await supabase
      .from('formulas')
      .select('win_rate')
      .eq('id', bestPublicFormula.id)
      .single()
    
    if (bestStats) {
      const { count } = await supabase
        .from('formulas')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gte('total_matches', 10)
        .gt('win_rate', bestStats.win_rate)
      
      leaderboardRank = (count || 0) + 1
    }
  }
  
  const stats: UserStats = {
    total_formulas: formulas.length,
    active_formulas: activeFormulas.length,
    total_matches: totalMatches,
    overall_win_rate: Math.round(weightedWinRate * 10) / 10,
    overall_avg_return: Math.round(weightedReturn * 10) / 10,
    best_formula: bestFormula ? {
      id: bestFormula.id,
      name: bestFormula.name,
      win_rate: bestFormula.win_rate,
    } : null,
    leaderboard_rank: leaderboardRank,
  }
  
  return NextResponse.json<ApiResponse<UserStats>>({ data: stats })
}
