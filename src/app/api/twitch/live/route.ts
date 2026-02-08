import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  checkMultipleStreams,
  extractTwitchUsername,
  type TwitchStreamInfo,
} from '@/lib/services/twitch'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface LiveUser {
  username: string
  avatar_url: string | null
  twitch_url: string
  twitch_username: string
  stream: TwitchStreamInfo
}

// GET /api/twitch/live - Get all currently live DegenArena users
// Optional: ?username=foo to check a single user
export async function GET(request: NextRequest) {
  const singleUsername = request.nextUrl.searchParams.get('username')

  try {
    // Build query for users with twitch URLs
    let query = supabaseAdmin
      .from('profiles')
      .select('username, avatar_url, twitch_url')
      .not('twitch_url', 'is', null)

    if (singleUsername) {
      query = query.ilike('username', singleUsername)
    }

    const { data: profiles, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Extract Twitch usernames from URLs
    const usernameMap = new Map<string, typeof profiles[0]>()
    const twitchUsernames: string[] = []

    for (const profile of profiles) {
      const twitchUsername = extractTwitchUsername(profile.twitch_url)
      if (twitchUsername) {
        usernameMap.set(twitchUsername, profile)
        twitchUsernames.push(twitchUsername)
      }
    }

    if (twitchUsernames.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Check all streams at once (batched Twitch API call)
    const streamStatuses = await checkMultipleStreams(twitchUsernames)

    // Build response - only include live users (unless checking single user)
    const liveUsers: LiveUser[] = []

    for (const [twitchUsername, profile] of Array.from(usernameMap.entries())) {
      const stream = streamStatuses.get(twitchUsername) || { isLive: false }

      if (stream.isLive || singleUsername) {
        liveUsers.push({
          username: profile.username,
          avatar_url: profile.avatar_url,
          twitch_url: profile.twitch_url,
          twitch_username: twitchUsername,
          stream,
        })
      }
    }

    // Sort by viewer count descending
    liveUsers.sort((a, b) => (b.stream.viewerCount || 0) - (a.stream.viewerCount || 0))

    return NextResponse.json({ data: liveUsers })
  } catch (err) {
    console.error('Twitch live check error:', err)
    return NextResponse.json(
      { error: 'Failed to check live status' },
      { status: 500 }
    )
  }
}
