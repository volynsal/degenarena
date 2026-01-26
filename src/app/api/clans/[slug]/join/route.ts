import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// POST /api/clans/[slug]/join - Join a clan
export async function POST(
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
  
  // Get clan
  const { data: clan, error: clanError } = await supabase
    .from('clans')
    .select('id, is_public, member_count, max_members, invite_code')
    .eq('slug', params.slug)
    .single()
  
  if (clanError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check if clan is full
  if (clan.member_count >= clan.max_members) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan is full'
    }, { status: 400 })
  }
  
  // If clan is private, check invite code
  if (!clan.is_public) {
    const body = await request.json().catch(() => ({}))
    if (body.invite_code !== clan.invite_code) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Invalid invite code'
      }, { status: 400 })
    }
  }
  
  // Join clan
  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({
      clan_id: clan.id,
      user_id: session.user.id,
      role: 'member',
    })
  
  if (joinError) {
    return NextResponse.json<ApiResponse<null>>({
      error: joinError.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<{ joined: boolean }>>({
    data: { joined: true },
    message: 'Joined clan successfully'
  })
}

// DELETE /api/clans/[slug]/join - Leave a clan
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
  
  // Owner can't leave (must delete or transfer)
  if (clan.owner_id === session.user.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Owners cannot leave. Transfer ownership or delete the clan.'
    }, { status: 400 })
  }
  
  // Leave clan
  const { error } = await supabase
    .from('clan_members')
    .delete()
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<{ left: boolean }>>({
    data: { left: true },
    message: 'Left clan successfully'
  })
}
