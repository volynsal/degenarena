import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface ClanListItem {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  member_count: number
  total_matches: number
  avg_win_rate: number
  owner_username: string
}

// GET /api/clans - List clans
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const sort = searchParams.get('sort') || 'top' // top, new, members
  const search = searchParams.get('search') || ''
  
  let query = supabase
    .from('clans')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      member_count,
      total_matches,
      avg_win_rate,
      created_at,
      owner:profiles!owner_id(username)
    `)
    .eq('is_public', true)
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }
  
  switch (sort) {
    case 'new':
      query = query.order('created_at', { ascending: false })
      break
    case 'members':
      query = query.order('member_count', { ascending: false })
      break
    case 'top':
    default:
      query = query.order('avg_win_rate', { ascending: false })
      break
  }
  
  const { data: clans, error } = await query.limit(50)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  const clanList: ClanListItem[] = (clans || []).map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    logo_url: c.logo_url,
    member_count: c.member_count,
    total_matches: c.total_matches,
    avg_win_rate: c.avg_win_rate,
    owner_username: (c.owner as any)?.username || 'Unknown',
  }))
  
  return NextResponse.json<ApiResponse<ClanListItem[]>>({
    data: clanList
  })
}

// POST /api/clans - Create a clan
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Check if user is already in a clan
  const { data: existingMembership } = await supabase
    .from('clan_members')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (existingMembership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already in a clan. Leave your current clan first.'
    }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    
    if (!body.name || body.name.trim().length < 3) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Clan name must be at least 3 characters'
      }, { status: 400 })
    }
    
    // Generate slug
    const slug = body.name.trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Create clan (always private - invite-only)
    const { data: clan, error: clanError } = await supabase
      .from('clans')
      .insert({
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        owner_id: session.user.id,
        is_public: false,
      })
      .select()
      .single()
    
    if (clanError) {
      if (clanError.code === '23505') {
        return NextResponse.json<ApiResponse<null>>({
          error: 'A clan with this name already exists'
        }, { status: 400 })
      }
      throw clanError
    }
    
    // Add creator as owner member
    await supabase
      .from('clan_members')
      .insert({
        clan_id: clan.id,
        user_id: session.user.id,
        role: 'owner',
      })
    
    return NextResponse.json<ApiResponse<typeof clan>>({
      data: clan,
      message: 'Clan created successfully'
    }, { status: 201 })
    
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message || 'Failed to create clan'
    }, { status: 500 })
  }
}
