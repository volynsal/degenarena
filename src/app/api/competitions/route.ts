import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Competition, ApiResponse } from '@/types/database'

// GET /api/competitions - List all competitions
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const status = searchParams.get('status') // upcoming, active, completed
  const type = searchParams.get('type') // daily_flip, weekly, head_to_head, clan_war
  const limit = parseInt(searchParams.get('limit') || '20')
  
  // Get current user for checking their entries
  const { data: { user } } = await supabase.auth.getUser()
  
  let query = supabase
    .from('competitions')
    .select(`
      *,
      challenger:profiles!competitions_challenger_id_fkey(id, username, avatar_url),
      challenged:profiles!competitions_challenged_id_fkey(id, username, avatar_url)
    `)
    .order('starts_at', { ascending: true })
    .limit(limit)
  
  // Filter by status
  if (status === 'upcoming') {
    query = query.eq('status', 'upcoming')
  } else if (status === 'active') {
    query = query.eq('status', 'active')
  } else if (status === 'completed') {
    query = query.eq('status', 'completed')
  } else {
    // Default: show upcoming and active
    query = query.in('status', ['upcoming', 'active'])
  }
  
  // Filter by type
  if (type) {
    query = query.eq('type', type)
  }
  
  const { data: competitions, error } = await query
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  // If user is logged in, check which competitions they've entered
  let userEntries: Record<string, unknown> = {}
  if (user) {
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('competition_id, id, formula_id, status')
      .eq('user_id', user.id)
      .in('competition_id', competitions?.map(c => c.id) || [])
    
    if (entries) {
      userEntries = entries.reduce((acc, entry) => {
        acc[entry.competition_id] = entry
        return acc
      }, {} as Record<string, unknown>)
    }
  }
  
  // Add computed fields
  const now = new Date()
  const enrichedCompetitions = competitions?.map(comp => {
    const startsAt = new Date(comp.starts_at)
    const endsAt = new Date(comp.ends_at)
    
    let live_status: 'upcoming' | 'live' | 'ended'
    if (now < startsAt) {
      live_status = 'upcoming'
    } else if (now > endsAt) {
      live_status = 'ended'
    } else {
      live_status = 'live'
    }
    
    return {
      ...comp,
      live_status,
      seconds_remaining: Math.max(0, (endsAt.getTime() - now.getTime()) / 1000),
      my_entry: userEntries[comp.id] || null,
    }
  })
  
  return NextResponse.json<ApiResponse<Competition[]>>({ 
    data: enrichedCompetitions as Competition[]
  })
}
