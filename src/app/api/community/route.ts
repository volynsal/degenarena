import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface CommunityFormula {
  id: string
  name: string
  description: string | null
  user_id: string
  username: string
  avatar_url: string | null
  win_rate: number
  total_matches: number
  avg_return: number
  upvote_count: number
  copy_count: number
  created_at: string
  has_upvoted: boolean
}

// GET /api/community - Get public formulas for discovery
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { searchParams } = new URL(request.url)
  
  const sort = searchParams.get('sort') || 'trending' // trending, new, top, best
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  
  // Build query
  let query = supabase
    .from('formulas')
    .select(`
      id,
      name,
      description,
      user_id,
      win_rate,
      total_matches,
      avg_return,
      upvote_count,
      copy_count,
      created_at,
      profile:profiles(username, avatar_url)
    `)
    .eq('is_public', true)
  
  // Search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  
  // Sorting
  switch (sort) {
    case 'new':
      query = query.order('created_at', { ascending: false })
      break
    case 'top':
      query = query.order('upvote_count', { ascending: false })
      break
    case 'best':
      query = query
        .gte('total_matches', 5) // Minimum matches for "best"
        .order('win_rate', { ascending: false })
      break
    case 'trending':
    default:
      // Trending = combination of recent activity + upvotes
      query = query
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: false })
      break
  }
  
  // Pagination
  query = query.range(offset, offset + limit - 1)
  
  const { data: formulas, error } = await query
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  // Get user's upvotes if logged in
  let userUpvotes: Set<string> = new Set()
  if (session?.user?.id) {
    const { data: upvotes } = await supabase
      .from('formula_upvotes')
      .select('formula_id')
      .eq('user_id', session.user.id)
    
    if (upvotes) {
      userUpvotes = new Set(upvotes.map(u => u.formula_id))
    }
  }
  
  // Transform response
  const communityFormulas: CommunityFormula[] = (formulas || []).map(f => ({
    id: f.id,
    name: f.name,
    description: f.description,
    user_id: f.user_id,
    username: (f.profile as any)?.username || 'Anonymous',
    avatar_url: (f.profile as any)?.avatar_url || null,
    win_rate: f.win_rate,
    total_matches: f.total_matches,
    avg_return: f.avg_return,
    upvote_count: f.upvote_count || 0,
    copy_count: f.copy_count || 0,
    created_at: f.created_at,
    has_upvoted: userUpvotes.has(f.id),
  }))
  
  return NextResponse.json<ApiResponse<CommunityFormula[]>>({
    data: communityFormulas
  })
}
