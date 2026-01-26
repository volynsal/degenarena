import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface MyClan {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  member_count: number
  total_matches: number
  avg_win_rate: number
  role: string
}

// GET /api/clans/me - Get user's current clan
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  // Get user's clan membership
  const { data: membership, error } = await supabase
    .from('clan_members')
    .select(`
      role,
      clan:clans(
        id,
        name,
        slug,
        description,
        logo_url,
        member_count,
        total_matches,
        avg_win_rate
      )
    `)
    .eq('user_id', session.user.id)
    .single()
  
  if (error || !membership) {
    // Not in a clan
    return NextResponse.json<ApiResponse<null>>({
      data: null
    })
  }
  
  const clan = membership.clan as any
  
  const myClan: MyClan = {
    id: clan.id,
    name: clan.name,
    slug: clan.slug,
    description: clan.description,
    logo_url: clan.logo_url,
    member_count: clan.member_count,
    total_matches: clan.total_matches,
    avg_win_rate: clan.avg_win_rate,
    role: membership.role,
  }
  
  return NextResponse.json<ApiResponse<MyClan>>({
    data: myClan
  })
}
