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
        const twitchUrl = body.twitch_url.trim()
        // Accept twitch.tv URLs or just the username
        if (!twitchUrl.match(/^(https?:\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9_]+\/?$/) && 
            !twitchUrl.match(/^[a-zA-Z0-9_]+$/)) {
          return NextResponse.json<ApiResponse<null>>({ 
            error: 'Invalid Twitch URL. Use format: https://twitch.tv/username or just your username' 
          }, { status: 400 })
        }
        // Normalize to full URL
        if (!twitchUrl.includes('twitch.tv')) {
          updateData.twitch_url = `https://twitch.tv/${twitchUrl}`
        } else if (!twitchUrl.startsWith('http')) {
          updateData.twitch_url = `https://${twitchUrl}`
        } else {
          updateData.twitch_url = twitchUrl
        }
      } else {
        updateData.twitch_url = null
      }
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', session.user.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: error.message 
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
