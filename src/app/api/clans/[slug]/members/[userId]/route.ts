import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// PATCH /api/clans/[slug]/members/[userId] - Update member role (owners only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  const serviceClient = getServiceClient()
  
  // Get clan
  const { data: clan } = await serviceClient
    .from('clans')
    .select('id')
    .eq('slug', params.slug)
    .single()
  
  if (!clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check if current user is an owner
  const { data: currentMembership } = await serviceClient
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!currentMembership || currentMembership.role !== 'owner') {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Only clan owners can change member roles'
    }, { status: 403 })
  }
  
  // Get target member
  const { data: targetMember } = await serviceClient
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', params.userId)
    .single()
  
  if (!targetMember) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Member not found'
    }, { status: 404 })
  }
  
  try {
    const body = await request.json()
    const newRole = body.role
    
    if (!['owner', 'admin', 'member'].includes(newRole)) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Invalid role. Must be owner, admin, or member.'
      }, { status: 400 })
    }
    
    // Check owner count if promoting to owner
    if (newRole === 'owner') {
      const { count } = await serviceClient
        .from('clan_members')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clan.id)
        .eq('role', 'owner')
      
      if ((count || 0) >= 5) {
        return NextResponse.json<ApiResponse<null>>({
          error: 'A clan can have at most 5 owners'
        }, { status: 400 })
      }
    }
    
    // Can't demote self if you're the only owner
    if (params.userId === session.user.id && targetMember.role === 'owner' && newRole !== 'owner') {
      const { count } = await serviceClient
        .from('clan_members')
        .select('*', { count: 'exact', head: true })
        .eq('clan_id', clan.id)
        .eq('role', 'owner')
      
      if ((count || 0) <= 1) {
        return NextResponse.json<ApiResponse<null>>({
          error: 'Cannot demote yourself - you are the only owner'
        }, { status: 400 })
      }
    }
    
    // Update role
    const { error } = await serviceClient
      .from('clan_members')
      .update({ role: newRole })
      .eq('clan_id', clan.id)
      .eq('user_id', params.userId)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json<ApiResponse<{ role: string }>>({
      data: { role: newRole },
      message: `Member role updated to ${newRole}`
    })
    
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message || 'Failed to update member role'
    }, { status: 500 })
  }
}

// DELETE /api/clans/[slug]/members/[userId] - Remove member from clan (owner/admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; userId: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Get clan
  const { data: clan } = await supabase
    .from('clans')
    .select('id, owner_id')
    .eq('slug', params.slug)
    .single()
  
  if (!clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check if current user is owner or admin
  const { data: membership } = await supabase
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  const isOwner = clan.owner_id === session.user.id
  const isAdmin = membership?.role === 'admin'
  
  if (!isOwner && !isAdmin) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Only clan owner or admin can remove members'
    }, { status: 403 })
  }
  
  // Can't remove the owner
  if (params.userId === clan.owner_id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Cannot remove the clan owner'
    }, { status: 400 })
  }
  
  // Admins can't remove other admins
  if (isAdmin && !isOwner) {
    const { data: targetMember } = await supabase
      .from('clan_members')
      .select('role')
      .eq('clan_id', clan.id)
      .eq('user_id', params.userId)
      .single()
    
    if (targetMember?.role === 'admin') {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Admins cannot remove other admins'
      }, { status: 403 })
    }
  }
  
  // Remove member
  const { error } = await supabase
    .from('clan_members')
    .delete()
    .eq('clan_id', clan.id)
    .eq('user_id', params.userId)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to remove member'
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<null>>({
    data: null,
    message: 'Member removed'
  })
}
