import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface ClanDetails {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  owner_id: string
  is_public: boolean
  invite_code: string | null
  member_count: number
  total_matches: number
  avg_win_rate: number
  created_at: string
  owner: {
    username: string
    avatar_url: string | null
  }
  members: {
    user_id: string
    username: string
    avatar_url: string | null
    role: string
    win_rate: number
    total_matches: number
  }[]
  is_member: boolean
  user_role: string | null
}

// GET /api/clans/[slug] - Get clan details
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get clan
  const { data: clan, error } = await supabase
    .from('clans')
    .select(`
      *,
      owner:profiles!owner_id(username, avatar_url)
    `)
    .eq('slug', params.slug)
    .single()
  
  if (error || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Get members with their stats
  const { data: members } = await supabase
    .from('clan_members')
    .select(`
      user_id,
      role,
      profile:profiles(username, avatar_url)
    `)
    .eq('clan_id', clan.id)
    .order('role', { ascending: true })
  
  // Get member formula stats
  const memberStats: any[] = []
  for (const member of members || []) {
    const { data: formulas } = await supabase
      .from('formulas')
      .select('win_rate, total_matches')
      .eq('user_id', member.user_id)
    
    const totalMatches = formulas?.reduce((sum, f) => sum + (f.total_matches || 0), 0) || 0
    const avgWinRate = formulas && formulas.length > 0
      ? formulas.reduce((sum, f) => sum + (f.win_rate || 0), 0) / formulas.length
      : 0
    
    memberStats.push({
      user_id: member.user_id,
      username: (member.profile as any)?.username || 'Unknown',
      avatar_url: (member.profile as any)?.avatar_url || null,
      role: member.role,
      win_rate: Math.round(avgWinRate * 10) / 10,
      total_matches: totalMatches,
    })
  }
  
  // Check if current user is member
  let isMember = false
  let userRole = null
  if (session?.user?.id) {
    const { data: membership } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clan.id)
      .eq('user_id', session.user.id)
      .single()
    
    isMember = !!membership
    userRole = membership?.role || null
  }
  
  // Only show invite code to members
  const clanDetails: ClanDetails = {
    id: clan.id,
    name: clan.name,
    slug: clan.slug,
    description: clan.description,
    logo_url: clan.logo_url,
    owner_id: clan.owner_id,
    is_public: clan.is_public,
    invite_code: isMember ? clan.invite_code : null,
    member_count: clan.member_count,
    total_matches: clan.total_matches,
    avg_win_rate: clan.avg_win_rate,
    created_at: clan.created_at,
    owner: clan.owner as any,
    members: memberStats,
    is_member: isMember,
    user_role: userRole,
  }
  
  return NextResponse.json<ApiResponse<ClanDetails>>({
    data: clanDetails
  })
}

// DELETE /api/clans/[slug] - Delete clan (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  const { error } = await supabase
    .from('clans')
    .delete()
    .eq('slug', params.slug)
    .eq('owner_id', session.user.id)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to delete clan or not authorized'
    }, { status: 400 })
  }
  
  return NextResponse.json<ApiResponse<null>>({
    data: null,
    message: 'Clan deleted'
  })
}
