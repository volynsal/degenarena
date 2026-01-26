import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  earned_at: string
}

// GET /api/profiles/[username]/badges - Get user's badges
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  
  // Get user
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', params.username)
    .single()
  
  if (userError || !user) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'User not found'
    }, { status: 404 })
  }
  
  // Trigger badge check (awards any new badges)
  await supabase.rpc('check_and_award_badges', { p_user_id: user.id })
  
  // Get user's badges
  const { data: userBadges, error } = await supabase
    .from('user_badges')
    .select(`
      earned_at,
      badge:badges(
        id,
        name,
        description,
        icon,
        category,
        rarity,
        sort_order
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  const badges: Badge[] = (userBadges || []).map(ub => ({
    id: (ub.badge as any).id,
    name: (ub.badge as any).name,
    description: (ub.badge as any).description,
    icon: (ub.badge as any).icon,
    category: (ub.badge as any).category,
    rarity: (ub.badge as any).rarity,
    earned_at: ub.earned_at,
  }))
  
  // Sort by rarity (legendary first) then by sort_order
  const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
  badges.sort((a, b) => {
    const rarityDiff = (rarityOrder[a.rarity as keyof typeof rarityOrder] || 5) - 
                       (rarityOrder[b.rarity as keyof typeof rarityOrder] || 5)
    return rarityDiff
  })
  
  return NextResponse.json<ApiResponse<Badge[]>>({
    data: badges
  })
}
