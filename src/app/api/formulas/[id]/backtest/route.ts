import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface BacktestResult {
  formulaId: string
  formulaName: string
  period: string
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  avgReturn: number
  bestMatch: {
    tokenSymbol: string
    return24h: number
    matchedAt: string
  } | null
  worstMatch: {
    tokenSymbol: string
    return24h: number
    matchedAt: string
  } | null
  matches: {
    tokenSymbol: string
    tokenName: string
    matchedAt: string
    priceAtMatch: number
    price24h: number | null
    return24h: number | null
    isWin: boolean | null
  }[]
}

// GET /api/formulas/[id]/backtest - Run backtest on historical matches
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { searchParams } = new URL(request.url)
  
  // Period: 7d, 30d, 90d, all
  const period = searchParams.get('period') || '30d'
  
  // Get formula
  const { data: formula, error: formulaError } = await supabase
    .from('formulas')
    .select('id, name, user_id, is_public')
    .eq('id', params.id)
    .single()
  
  if (formulaError || !formula) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula not found'
    }, { status: 404 })
  }
  
  // Check access
  if (!formula.is_public && formula.user_id !== session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 403 })
  }
  
  // Calculate date range
  let startDate: Date | null = null
  const now = new Date()
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    // 'all' - no filter
  }
  
  // Get matches with 24h returns (completed matches only)
  let query = supabase
    .from('token_matches')
    .select('*')
    .eq('formula_id', params.id)
    .not('return_24h', 'is', null)
    .order('matched_at', { ascending: false })
  
  if (startDate) {
    query = query.gte('matched_at', startDate.toISOString())
  }
  
  const { data: matches, error: matchesError } = await query
  
  if (matchesError) {
    return NextResponse.json<ApiResponse<null>>({
      error: matchesError.message
    }, { status: 500 })
  }
  
  if (!matches || matches.length === 0) {
    const emptyResult: BacktestResult = {
      formulaId: formula.id,
      formulaName: formula.name,
      period,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgReturn: 0,
      bestMatch: null,
      worstMatch: null,
      matches: [],
    }
    
    return NextResponse.json<ApiResponse<BacktestResult>>({
      data: emptyResult
    })
  }
  
  // Calculate stats
  const wins = matches.filter(m => m.is_win === true).length
  const losses = matches.filter(m => m.is_win === false).length
  const totalWithResult = wins + losses
  const winRate = totalWithResult > 0 ? (wins / totalWithResult) * 100 : 0
  const avgReturn = matches.reduce((sum, m) => sum + (m.return_24h || 0), 0) / matches.length
  
  // Find best and worst
  const sortedByReturn = [...matches].sort((a, b) => (b.return_24h || 0) - (a.return_24h || 0))
  const bestMatch = sortedByReturn[0]
  const worstMatch = sortedByReturn[sortedByReturn.length - 1]
  
  const result: BacktestResult = {
    formulaId: formula.id,
    formulaName: formula.name,
    period,
    totalMatches: matches.length,
    wins,
    losses,
    winRate: Math.round(winRate * 10) / 10,
    avgReturn: Math.round(avgReturn * 10) / 10,
    bestMatch: bestMatch ? {
      tokenSymbol: bestMatch.token_symbol,
      return24h: bestMatch.return_24h,
      matchedAt: bestMatch.matched_at,
    } : null,
    worstMatch: worstMatch ? {
      tokenSymbol: worstMatch.token_symbol,
      return24h: worstMatch.return_24h,
      matchedAt: worstMatch.matched_at,
    } : null,
    matches: matches.map(m => ({
      tokenSymbol: m.token_symbol,
      tokenName: m.token_name,
      matchedAt: m.matched_at,
      priceAtMatch: m.price_at_match,
      price24h: m.price_24h,
      return24h: m.return_24h,
      isWin: m.is_win,
    })),
  }
  
  return NextResponse.json<ApiResponse<BacktestResult>>({
    data: result
  })
}
