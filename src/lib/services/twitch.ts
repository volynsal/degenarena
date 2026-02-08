// Twitch Helix API integration for live stream detection
// Requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET env vars
// Register at https://dev.twitch.tv/console

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get an app access token from Twitch (client credentials flow)
 * Tokens are cached until expiry
 */
async function getAppToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  try {
    const res = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    })

    if (!res.ok) {
      console.error('Twitch token error:', await res.text())
      return null
    }

    const data = await res.json()
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }

    return cachedToken.token
  } catch (err) {
    console.error('Twitch token fetch failed:', err)
    return null
  }
}

export interface TwitchStreamInfo {
  isLive: boolean
  title?: string
  viewerCount?: number
  gameName?: string
  thumbnailUrl?: string
  startedAt?: string
}

/**
 * Extract Twitch username from a twitch URL
 * Handles: twitch.tv/user, www.twitch.tv/user, https://twitch.tv/user
 */
export function extractTwitchUsername(url: string): string | null {
  if (!url) return null

  try {
    // Handle plain usernames
    if (!url.includes('/') && !url.includes('.')) {
      return url.toLowerCase().trim()
    }

    // Normalize URL
    let normalized = url.trim()
    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized
    }

    const parsed = new URL(normalized)
    if (!parsed.hostname.includes('twitch.tv')) return null

    // Get the first path segment after /
    const parts = parsed.pathname.split('/').filter(Boolean)
    return parts[0]?.toLowerCase() || null
  } catch {
    return null
  }
}

/**
 * Check if a single Twitch user is currently live
 */
export async function checkStreamStatus(twitchUsername: string): Promise<TwitchStreamInfo> {
  const token = await getAppToken()
  const clientId = process.env.TWITCH_CLIENT_ID

  if (!token || !clientId) {
    return { isLive: false }
  }

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(twitchUsername)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': clientId,
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    )

    if (!res.ok) {
      console.error('Twitch stream check error:', res.status)
      return { isLive: false }
    }

    const data = await res.json()
    const stream = data.data?.[0]

    if (!stream) {
      return { isLive: false }
    }

    return {
      isLive: true,
      title: stream.title,
      viewerCount: stream.viewer_count,
      gameName: stream.game_name,
      thumbnailUrl: stream.thumbnail_url
        ?.replace('{width}', '440')
        ?.replace('{height}', '248'),
      startedAt: stream.started_at,
    }
  } catch (err) {
    console.error('Twitch stream check failed:', err)
    return { isLive: false }
  }
}

/**
 * Check live status for multiple Twitch usernames at once
 * Twitch API supports up to 100 user_login params per request
 */
export async function checkMultipleStreams(
  twitchUsernames: string[]
): Promise<Map<string, TwitchStreamInfo>> {
  const results = new Map<string, TwitchStreamInfo>()

  if (twitchUsernames.length === 0) return results

  const token = await getAppToken()
  const clientId = process.env.TWITCH_CLIENT_ID

  if (!token || !clientId) {
    // Return all as not live if no credentials
    twitchUsernames.forEach(u => results.set(u, { isLive: false }))
    return results
  }

  try {
    // Batch into groups of 100 (Twitch API limit)
    for (let i = 0; i < twitchUsernames.length; i += 100) {
      const batch = twitchUsernames.slice(i, i + 100)
      const params = batch.map(u => `user_login=${encodeURIComponent(u)}`).join('&')

      const res = await fetch(
        `https://api.twitch.tv/helix/streams?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': clientId,
          },
          next: { revalidate: 30 },
        }
      )

      if (!res.ok) continue

      const data = await res.json()
      const liveStreams = new Set<string>()

      for (const stream of data.data || []) {
        const username = stream.user_login?.toLowerCase()
        liveStreams.add(username)
        results.set(username, {
          isLive: true,
          title: stream.title,
          viewerCount: stream.viewer_count,
          gameName: stream.game_name,
          thumbnailUrl: stream.thumbnail_url
            ?.replace('{width}', '440')
            ?.replace('{height}', '248'),
          startedAt: stream.started_at,
        })
      }

      // Mark non-live users
      for (const username of batch) {
        if (!liveStreams.has(username.toLowerCase())) {
          results.set(username.toLowerCase(), { isLive: false })
        }
      }
    }
  } catch (err) {
    console.error('Twitch multi-stream check failed:', err)
  }

  return results
}
