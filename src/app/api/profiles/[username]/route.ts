import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface PublicProfile {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  twitter_handle: string | null
  follower_count: number
  following_count: number
  created_at: string
  clan: {
    id: string
    name: string
    slug: string
  } | null
  stats: {
    total_formulas: number
    total_matches: number
    avg_win_rate: number
    leaderboard_rank: number | null
  }
  is_following: boolean
}

// GET /api/profiles/[username] - Get public profile
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Get profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      bio,
      avatar_url,
      twitter_handle,
      follower_count,
      following_count,
      created_at,
      clan:clans(id, name, slug)
    `)
    .eq('username', params.username)
    .single()
  
  if (error || !profile) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'User not found'
    }, { status: 404 })
  }
  
  // Get user's formula stats
  const { data: formulas } = await supabase
    .from('formulas')
    .select('id, win_rate, total_matches')
    .eq('user_id', profile.id)
    .eq('is_public', true)
  
  const totalFormulas = formulas?.length || 0
  const totalMatches = formulas?.reduce((sum, f) => sum + (f.total_matches || 0), 0) || 0
  const avgWinRate = formulas && formulas.length > 0
    ? formulas.reduce((sum, f) => sum + (f.win_rate || 0), 0) / formulas.length
    : 0
  
  // Get leaderboard rank
  const { data: leaderboardEntry } = await supabase
    .from('leaderboard')
    .select('rank')
    .eq('user_id', profile.id)
    .order('rank', { ascending: true })
    .limit(1)
    .single()
  
  // Check if current user is following
  let isFollowing = false
  if (session?.user?.id && session.user.id !== profile.id) {
    const { data: follow } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', session.user.id)
      .eq('following_id', profile.id)
      .single()
    
    isFollowing = !!follow
  }
  
  const publicProfile: PublicProfile = {
    id: profile.id,
    username: profile.username,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    twitter_handle: profile.twitter_handle,
    follower_count: profile.follower_count || 0,
    following_count: profile.following_count || 0,
    created_at: profile.created_at,
    clan: profile.clan as any,
    stats: {
      total_formulas: totalFormulas,
      total_matches: totalMatches,
      avg_win_rate: Math.round(avgWinRate * 10) / 10,
      leaderboard_rank: leaderboardEntry?.rank || null,
    },
    is_following: isFollowing,
  }
  
  return NextResponse.json<ApiResponse<PublicProfile>>({
    data: publicProfile
  })
}
