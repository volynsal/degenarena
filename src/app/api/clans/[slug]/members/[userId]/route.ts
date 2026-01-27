import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

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
