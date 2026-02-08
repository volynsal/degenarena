import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Profile, ApiResponse } from '@/types/database'

// GET /api/user/profile - Get current user's profile
export async function GET() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<Profile>>({ 
    data: data as Profile 
  })
}

// PATCH /api/user/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    const updateData: Record<string, unknown> = {}
    
    if (body.username !== undefined) {
      const username = body.username.toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (username.length < 3) {
        return NextResponse.json<ApiResponse<null>>({ 
          error: 'Username must be at least 3 characters' 
        }, { status: 400 })
      }
      
      // Check if username is taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', session.user.id)
        .single()
      
      if (existing) {
        return NextResponse.json<ApiResponse<null>>({ 
          error: 'Username is already taken' 
        }, { status: 400 })
      }
      
      updateData.username = username
    }
    
    if (body.avatar_url !== undefined) {
      updateData.avatar_url = body.avatar_url
    }
    
    if (body.bio !== undefined) {
      updateData.bio = body.bio?.trim() || null
    }
    
    if (body.twitch_url !== undefined) {
      // Validate Twitch URL format if provided
      if (body.twitch_url && body.twitch_url.trim()) {
        let twitchUrl = body.twitch_url.trim()
        
        // Strip leading @ if user entered @username
        if (twitchUrl.startsWith('@')) {
          twitchUrl = twitchUrl.slice(1)
        }
        
        // Accept twitch.tv URLs or just the username
        const isFullUrl = twitchUrl.match(/^(https?:\/\/)?(www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/)
        const isUsername = twitchUrl.match(/^[a-zA-Z0-9_]{1,25}$/)
        
        if (!isFullUrl && !isUsername) {
          return NextResponse.json<ApiResponse<null>>({ 
            error: 'Invalid Twitch username. Only letters, numbers, and underscores are allowed.' 
          }, { status: 400 })
        }
        
        // Normalize to full URL
        if (isFullUrl) {
          // Extract username from URL and rebuild cleanly
          const username = isFullUrl[3]
          updateData.twitch_url = `https://twitch.tv/${username}`
        } else {
          updateData.twitch_url = `https://twitch.tv/${twitchUrl}`
        }
      } else {
        updateData.twitch_url = null
      }
    }
    
    // Only proceed with update if there are fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'No fields to update' 
      }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single()
    
    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json<ApiResponse<null>>({ 
        error: error.message 
      }, { status: 500 })
    }
    
    if (!data) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Profile update failed — no data returned' 
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<Profile>>({ 
      data: data as Profile,
      message: 'Profile updated successfully'
    })
    
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Invalid request body' 
    }, { status: 400 })
  }
}
