import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'
import { randomBytes } from 'crypto'

// Generate unique invite code
function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase()
}

// GET /api/clans/[slug]/invites - List invites (members only)
export async function GET(
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
    .select('id')
    .eq('slug', params.slug)
    .single()
  
  if (!clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check membership
  const { data: membership } = await supabase
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Not a member of this clan'
    }, { status: 403 })
  }
  
  // Get invites created by this user
  const { data: invites, error } = await supabase
    .from('clan_invites')
    .select(`
      id,
      code,
      is_used,
      used_at,
      expires_at,
      created_at,
      used_by:profiles!used_by(username)
    `)
    .eq('clan_id', clan.id)
    .eq('created_by', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<typeof invites>>({
    data: invites
  })
}

// POST /api/clans/[slug]/invites - Generate new invite code
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
  
  // Get clan
  const { data: clan } = await supabase
    .from('clans')
    .select('id, member_count, max_members')
    .eq('slug', params.slug)
    .single()
  
  if (!clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }
  
  // Check membership
  const { data: membership } = await supabase
    .from('clan_members')
    .select('role')
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)
    .single()
  
  if (!membership) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Not a member of this clan'
    }, { status: 403 })
  }
  
  // Check if clan is full
  if (clan.member_count >= clan.max_members) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan is full, cannot create invites'
    }, { status: 400 })
  }
  
  // Generate unique code (8 chars, uppercase hex)
  const code = generateInviteCode()
  
  // Optional: set expiry from request body
  let expiresAt = null
  try {
    const body = await request.json()
    if (body.expires_in_hours) {
      expiresAt = new Date(Date.now() + body.expires_in_hours * 60 * 60 * 1000).toISOString()
    }
  } catch {
    // No body or invalid JSON, that's fine
  }
  
  // Create invite
  const { data: invite, error } = await supabase
    .from('clan_invites')
    .insert({
      clan_id: clan.id,
      code,
      created_by: session.user.id,
      expires_at: expiresAt,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  // Generate full invite link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://degenarena.com'
  const inviteLink = `${baseUrl}/clans/join/${code}`
  
  return NextResponse.json<ApiResponse<{ invite: typeof invite; link: string }>>({
    data: { 
      invite, 
      link: inviteLink 
    },
    message: 'Invite created'
  }, { status: 201 })
}
