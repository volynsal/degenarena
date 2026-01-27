import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// POST /api/clans/join/[code] - Join a clan using an invite code
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  const code = params.code.toUpperCase()
  
  // Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('clan_invites')
    .select(`
      id,
      clan_id,
      is_used,
      expires_at,
      clan:clans(id, name, slug, member_count, max_members)
    `)
    .eq('code', code)
    .single()
  
  if (inviteError || !invite) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invalid invite code'
    }, { status: 404 })
  }
  
  // Check if invite is already used
  if (invite.is_used) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite code has already been used'
    }, { status: 400 })
  }
  
  // Check if invite has expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite code has expired'
    }, { status: 400 })
  }
  
  const clan = invite.clan as any
  
  // Check if clan is full
  if (clan.member_count >= clan.max_members) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This clan is full'
    }, { status: 400 })
  }
  
  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('clan_members')
    .select('id')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (existingMember) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already a member of this clan'
    }, { status: 400 })
  }
  
  // Check if user is already in another clan
  const { data: otherMembership } = await supabase
    .from('clan_members')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (otherMembership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already in a clan. Leave your current clan first.'
    }, { status: 400 })
  }
  
  // Add member to clan
  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({
      clan_id: clan.id,
      user_id: session.user.id,
      role: 'member',
    })
  
  if (joinError) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to join clan'
    }, { status: 500 })
  }
  
  // Mark invite as used
  await supabase
    .from('clan_invites')
    .update({
      is_used: true,
      used_by: session.user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', invite.id)
  
  return NextResponse.json<ApiResponse<{ slug: string }>>({
    data: { slug: clan.slug },
    message: 'Successfully joined clan'
  })
}
