import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// GET /api/clans/join/[code] - Get invite info (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createClient()
  
  // Get invite with clan info
  const { data: invite, error } = await supabase
    .from('clan_invites')
    .select(`
      id,
      code,
      is_used,
      expires_at,
      clan:clans(
        id,
        name,
        slug,
        description,
        logo_url,
        member_count,
        max_members,
        avg_win_rate,
        owner:profiles!owner_id(username)
      )
    `)
    .eq('code', params.code.toUpperCase())
    .single()
  
  if (error || !invite) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invalid invite code'
    }, { status: 404 })
  }
  
  // Check if already used
  if (invite.is_used) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite has already been used'
    }, { status: 400 })
  }
  
  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite has expired'
    }, { status: 400 })
  }
  
  return NextResponse.json<ApiResponse<{ clan: typeof invite.clan }>>({
    data: { clan: invite.clan }
  })
}

// POST /api/clans/join/[code] - Use invite to join clan
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
  
  // Get invite
  const { data: invite, error: inviteError } = await supabase
    .from('clan_invites')
    .select(`
      id,
      clan_id,
      is_used,
      expires_at,
      clan:clans(id, slug, member_count, max_members)
    `)
    .eq('code', params.code.toUpperCase())
    .single()
  
  if (inviteError || !invite) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invalid invite code'
    }, { status: 404 })
  }
  
  // Check if already used
  if (invite.is_used) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite has already been used'
    }, { status: 400 })
  }
  
  // Check if expired
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This invite has expired'
    }, { status: 400 })
  }
  
  const clan = invite.clan as any
  
  // Check if clan is full
  if (clan.member_count >= clan.max_members) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan is full'
    }, { status: 400 })
  }
  
  // Join clan
  const { error: joinError } = await supabase
    .from('clan_members')
    .insert({
      clan_id: invite.clan_id,
      user_id: session.user.id,
      role: 'member',
    })
  
  if (joinError) {
    return NextResponse.json<ApiResponse<null>>({
      error: joinError.message
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
    message: 'Successfully joined clan!'
  })
}
