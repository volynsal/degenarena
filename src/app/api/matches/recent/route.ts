import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TokenMatch, ApiResponse } from '@/types/database'

// GET /api/matches/recent - Get recent matches for the current user
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  
  // Get user's formulas first
  const { data: formulas } = await supabase
    .from('formulas')
    .select('id')
    .eq('user_id', session.user.id)
  
  if (!formulas || formulas.length === 0) {
    return NextResponse.json<ApiResponse<TokenMatch[]>>({ 
      data: [] 
    })
  }
  
  const formulaIds = formulas.map(f => f.id)
  
  // Get recent matches for those formulas
  const { data, error } = await supabase
    .from('token_matches')
    .select('*, formula:formulas(id, name)')
    .in('formula_id', formulaIds)
    .order('matched_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<TokenMatch[]>>({ 
    data: data as TokenMatch[] 
  })
}
