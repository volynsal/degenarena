import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TokenMatch, ApiResponse, PaginatedResponse } from '@/types/database'

// GET /api/formulas/[id]/matches - Get matches for a formula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const offset = (page - 1) * pageSize
  
  // First check if user has access to this formula
  const { data: formula } = await supabase
    .from('formulas')
    .select('user_id, is_public')
    .eq('id', params.id)
    .single()
  
  if (!formula) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Formula not found' 
    }, { status: 404 })
  }
  
  if (!formula.is_public && formula.user_id !== session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 403 })
  }
  
  // Get matches
  const { data, error, count } = await supabase
    .from('token_matches')
    .select('*', { count: 'exact' })
    .eq('formula_id', params.id)
    .order('matched_at', { ascending: false })
    .range(offset, offset + pageSize - 1)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  const response: PaginatedResponse<TokenMatch> = {
    data: data as TokenMatch[],
    total: count || 0,
    page,
    pageSize,
    hasMore: (offset + pageSize) < (count || 0)
  }
  
  return NextResponse.json(response)
}
