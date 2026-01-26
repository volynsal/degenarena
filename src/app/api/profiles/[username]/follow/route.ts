import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// POST /api/profiles/[username]/follow - Toggle follow
export async function POST(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Get target user
  const { data: targetUser, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', params.username)
    .single()
  
  if (userError || !targetUser) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'User not found'
    }, { status: 404 })
  }
  
  // Can't follow yourself
  if (targetUser.id === session.user.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Cannot follow yourself'
    }, { status: 400 })
  }
  
  // Check if already following
  const { data: existingFollow } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', session.user.id)
    .eq('following_id', targetUser.id)
    .single()
  
  if (existingFollow) {
    // Unfollow
    const { error: deleteError } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', session.user.id)
      .eq('following_id', targetUser.id)
    
    if (deleteError) {
      return NextResponse.json<ApiResponse<null>>({
        error: deleteError.message
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ following: boolean }>>({
      data: { following: false }
    })
  } else {
    // Follow
    const { error: insertError } = await supabase
      .from('user_follows')
      .insert({
        follower_id: session.user.id,
        following_id: targetUser.id,
      })
    
    if (insertError) {
      return NextResponse.json<ApiResponse<null>>({
        error: insertError.message
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ following: boolean }>>({
      data: { following: true }
    })
  }
}
