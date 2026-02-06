import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// Service role client for operations that need to bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface ClanDetails {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  telegram_link: string | null
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
    twitch_url: string | null
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
  const serviceClient = getServiceClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get clan using service client to bypass RLS (clan pages should be viewable)
  const { data: clan, error } = await serviceClient
    .from('clans')
    .select(`
      *,
      owner:profiles!owner_id(username, avatar_url)
    `)
    .eq('slug', params.slug)
    .single()
  
  console.log('GET /api/clans/[slug] - slug:', params.slug, 'clan:', clan?.id, 'error:', error?.message)
  
  if (error || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Get members using service client to bypass RLS
  const { data: members, error: membersError } = await serviceClient
    .from('clan_members')
    .select('user_id, role')
    .eq('clan_id', clan.id)
    .order('joined_at', { ascending: true })
  
  if (membersError) {
    console.error('Error fetching members:', membersError)
  }
  
  // Get member details and stats
  const memberStats: any[] = []
  for (const member of members || []) {
    // Get profile separately (including twitch_url)
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('username, avatar_url, twitch_url')
      .eq('id', member.user_id)
      .single()
    
    // Get formula stats
    const { data: formulas } = await serviceClient
      .from('formulas')
      .select('win_rate, total_matches')
      .eq('user_id', member.user_id)
    
    const totalMatches = formulas?.reduce((sum, f) => sum + (f.total_matches || 0), 0) || 0
    const avgWinRate = formulas && formulas.length > 0
      ? formulas.reduce((sum, f) => sum + (f.win_rate || 0), 0) / formulas.length
      : 0
    
    memberStats.push({
      user_id: member.user_id,
      username: profile?.username || 'Unknown User',
      avatar_url: profile?.avatar_url || null,
      twitch_url: profile?.twitch_url || null,
      role: member.role,
      win_rate: Math.round(avgWinRate * 10) / 10,
      total_matches: totalMatches,
    })
  }
  
  // Check if current user is member
  let isMember = false
  let userRole = null
  if (session?.user?.id) {
    const { data: membership } = await serviceClient
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
    telegram_link: clan.telegram_link || null,
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

// PATCH /api/clans/[slug] - Update clan settings (owners only)
export async function PATCH(
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
  
  const serviceClient = getServiceClient()
  
  // Get clan and verify user is an owner
  const { data: clan, error: fetchError } = await serviceClient
    .from('clans')
    .select('id')
    .eq('slug', params.slug)
    .single()
  
  if (fetchError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check if user is an owner (not just member or admin)
  const { data: membership } = await serviceClient
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Only clan owners can update clan settings'
    }, { status: 403 })
  }
  
  try {
    const body = await request.json()
    
    const updateData: Record<string, any> = {}
    
    // Only update fields that are provided
    if (body.name !== undefined) {
      if (body.name.trim().length < 3) {
        return NextResponse.json<ApiResponse<null>>({
          error: 'Clan name must be at least 3 characters'
        }, { status: 400 })
      }
      updateData.name = body.name.trim()
      // Also update slug if name changes
      updateData.slug = body.name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }
    
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    
    if (body.logo_url !== undefined) {
      updateData.logo_url = body.logo_url || null
    }
    
    if (body.telegram_link !== undefined) {
      // Validate telegram link format if provided
      if (body.telegram_link && !body.telegram_link.match(/^https?:\/\/(t\.me|telegram\.me)\/.+/)) {
        return NextResponse.json<ApiResponse<null>>({
          error: 'Invalid Telegram link. Use format: https://t.me/groupname'
        }, { status: 400 })
      }
      updateData.telegram_link = body.telegram_link || null
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'No valid fields to update'
      }, { status: 400 })
    }
    
    updateData.updated_at = new Date().toISOString()
    
    const { data: updatedClan, error: updateError } = await serviceClient
      .from('clans')
      .update(updateData)
      .eq('id', clan.id)
      .select()
      .single()
    
    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json<ApiResponse<null>>({
          error: 'A clan with this name already exists'
        }, { status: 400 })
      }
      throw updateError
    }
    
    return NextResponse.json<ApiResponse<typeof updatedClan>>({
      data: updatedClan,
      message: 'Clan updated successfully'
    })
    
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message || 'Failed to update clan'
    }, { status: 500 })
  }
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
  
  // Use service client to bypass RLS for full cleanup
  const serviceClient = getServiceClient()
  
  // First verify the clan exists and user is owner
  const { data: clan, error: fetchError } = await serviceClient
    .from('clans')
    .select('id, owner_id')
    .eq('slug', params.slug)
    .single()
  
  if (fetchError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  if (clan.owner_id !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Only the clan owner can delete the clan'
    }, { status: 403 })
  }
  
  // Get all member user IDs before deleting
  const { data: members } = await serviceClient
    .from('clan_members')
    .select('user_id')
    .eq('clan_id', clan.id)
  
  const memberIds = members?.map(m => m.user_id) || []
  
  // Clear clan_id from all member profiles
  if (memberIds.length > 0) {
    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({ clan_id: null })
      .in('id', memberIds)
    
    if (profileError) {
      console.error('Failed to clear profile clan_ids:', profileError)
    }
  }
  
  // Delete all clan invites
  const { error: invitesError } = await serviceClient
    .from('clan_invites')
    .delete()
    .eq('clan_id', clan.id)
  
  if (invitesError) {
    console.error('Failed to delete clan invites:', invitesError)
  }
  
  // Delete all clan members
  const { error: membersError } = await serviceClient
    .from('clan_members')
    .delete()
    .eq('clan_id', clan.id)
  
  if (membersError) {
    console.error('Failed to delete clan members:', membersError)
  }
  
  // Now delete the clan
  const { error: deleteError } = await serviceClient
    .from('clans')
    .delete()
    .eq('id', clan.id)
  
  if (deleteError) {
    console.error('Failed to delete clan:', deleteError)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to delete clan: ' + deleteError.message
    }, { status: 500 })
  }
  
  // Verify deletion
  const { data: checkClan } = await serviceClient
    .from('clans')
    .select('id')
    .eq('id', clan.id)
    .single()
  
  if (checkClan) {
    console.error('Clan still exists after delete attempt')
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan deletion failed - please try again'
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<null>>({
    data: null,
    message: 'Clan deleted successfully'
  })
}
