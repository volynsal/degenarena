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

// POST /api/clans/[slug]/join - Join a public clan
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

  const serviceClient = getServiceClient()

  // Get clan
  const { data: clan, error: clanError } = await serviceClient
    .from('clans')
    .select('id, is_public, name')
    .eq('slug', params.slug)
    .single()

  if (clanError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }

  if (!clan.is_public) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'This clan is private. You need an invite code to join.'
    }, { status: 403 })
  }

  // Check if user is already in a clan
  const { data: existingMembership } = await serviceClient
    .from('clan_members')
    .select('clan_id')
    .eq('user_id', session.user.id)
    .limit(1)

  if (existingMembership && existingMembership.length > 0) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'You are already in a clan. Leave your current clan first.'
    }, { status: 400 })
  }

  // Add member
  const { error: joinError } = await serviceClient
    .from('clan_members')
    .insert({
      clan_id: clan.id,
      user_id: session.user.id,
      role: 'member',
    })

  if (joinError) {
    if (joinError.code === '23505') {
      return NextResponse.json<ApiResponse<null>>({
        error: 'You are already a member of this clan'
      }, { status: 400 })
    }
    console.error('Error joining clan:', joinError)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to join clan'
    }, { status: 500 })
  }

  // Update profile with clan_id
  await serviceClient
    .from('profiles')
    .update({ clan_id: clan.id })
    .eq('id', session.user.id)

  // Update member count
  await serviceClient
    .from('clans')
    .update({ member_count: (await serviceClient.from('clan_members').select('id', { count: 'exact', head: true }).eq('clan_id', clan.id)).count || 1 })
    .eq('id', clan.id)

  return NextResponse.json<ApiResponse<null>>({
    data: null,
    message: `Joined ${clan.name} successfully`
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

  const serviceClient = getServiceClient()

  // Get clan
  const { data: clan, error: clanError } = await serviceClient
    .from('clans')
    .select('id, owner_id, name')
    .eq('slug', params.slug)
    .single()

  if (clanError || !clan) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan not found'
    }, { status: 404 })
  }

  // Owners can't leave their own clan (they must delete it)
  if (clan.owner_id === session.user.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Clan owners cannot leave. Transfer ownership or delete the clan.'
    }, { status: 400 })
  }

  // Remove membership
  const { error: leaveError } = await serviceClient
    .from('clan_members')
    .delete()
    .eq('clan_id', clan.id)
    .eq('user_id', session.user.id)

  if (leaveError) {
    console.error('Error leaving clan:', leaveError)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Failed to leave clan'
    }, { status: 500 })
  }

  // Clear clan_id from profile
  await serviceClient
    .from('profiles')
    .update({ clan_id: null })
    .eq('id', session.user.id)

  // Update member count
  await serviceClient
    .from('clans')
    .update({ member_count: (await serviceClient.from('clan_members').select('id', { count: 'exact', head: true }).eq('clan_id', clan.id)).count || 0 })
    .eq('id', clan.id)

  return NextResponse.json<ApiResponse<null>>({
    data: null,
    message: `Left ${clan.name} successfully`
  })
}
