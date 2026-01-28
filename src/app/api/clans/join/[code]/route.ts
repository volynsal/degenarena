import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// Service role client to bypass RLS for invite lookups
// (non-members need to read invites to join)
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/clans/join/[code] - Validate invite and get clan info (for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Please sign in to join a clan'
    }, { status: 401 })
  }
  
  const code = params.code.toUpperCase()
  const serviceClient = getServiceClient()
  
  // Find the invite using service role (bypasses RLS)
  const { data: invite, error: inviteError } = await serviceClient
    .from('clan_invites')
    .select(`
      id,
      clan_id,
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
        owner_id
      )
    `)
    .eq('code', code)
    .single()
  
  console.log('GET invite lookup - code:', code, 'result:', invite, 'error:', inviteError)
  
  if (inviteError) {
    console.error('GET invite lookup error:', inviteError)
    return NextResponse.json<ApiResponse<null>>({
      error: `Invalid invite code: ${inviteError.message}`
    }, { status: 404 })
  }
  
  if (!invite) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invalid invite code - not found'
    }, { status: 404 })
  }
  
  if (!invite.clan) {
    console.error('GET - Invite found but clan is null:', invite)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invite code is valid but the clan no longer exists'
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
  
  // Check if user is already in this clan
  const { data: existingMember } = await serviceClient
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
  const { data: otherMembership } = await serviceClient
    .from('clan_members')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (otherMembership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already in a clan. Leave your current clan first.'
    }, { status: 400 })
  }
  
  // Get owner info
  const { data: owner } = await serviceClient
    .from('profiles')
    .select('username')
    .eq('id', clan.owner_id)
    .single()
  
  return NextResponse.json<ApiResponse<{ clan: any }>>({
    data: {
      clan: {
        ...clan,
        owner: owner || { username: 'Unknown' }
      }
    }
  })
}

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
  const serviceClient = getServiceClient()
  
  // Find the invite using service role (bypasses RLS)
  const { data: invite, error: inviteError } = await serviceClient
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
  
  if (inviteError) {
    console.error('Invite lookup error:', inviteError)
    return NextResponse.json<ApiResponse<null>>({
      error: `Invalid invite code: ${inviteError.message}`
    }, { status: 404 })
  }
  
  if (!invite) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invalid invite code - not found'
    }, { status: 404 })
  }
  
  if (!invite.clan) {
    console.error('Invite found but clan is null:', invite)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Invite code is valid but the clan no longer exists'
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
  
  // Check if user is already a member (use service client to bypass RLS)
  const { data: existingMember } = await serviceClient
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
  const { data: otherMembership } = await serviceClient
    .from('clan_members')
    .select('id')
    .eq('user_id', session.user.id)
    .single()
  
  if (otherMembership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already in a clan. Leave your current clan first.'
    }, { status: 400 })
  }
  
  // Add member to clan (use service client to bypass RLS)
  const { error: joinError } = await serviceClient
    .from('clan_members')
    .insert({
      clan_id: clan.id,
      user_id: session.user.id,
      role: 'member',
    })
  
  if (joinError) {
    console.error('Join clan error:', joinError)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to join clan'
    }, { status: 500 })
  }
  
  // Mark invite as used
  await serviceClient
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
