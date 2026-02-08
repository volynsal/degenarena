import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, Profile } from '@/types/database'

// Service role client to bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface PublicProfile extends Profile {
  total_matches: number
  total_wins: number
  win_rate: number
  total_formulas: number
  public_formulas: number
  clan?: {
    name: string
    slug: string
    logo_url: string | null
  } | null
  is_own_profile: boolean
  wallet_stats?: {
    total_pnl_usd: number
    realized_pnl_usd: number
    unrealized_pnl_usd: number
    total_tokens_traded: number
    total_transactions: number
    winning_tokens: number
    losing_tokens: number
    win_rate: number
    best_trade_token: string | null
    best_trade_pnl: number
    worst_trade_token: string | null
    worst_trade_pnl: number
    last_refreshed_at: string
  } | null
}

// GET /api/users/[username] - Get public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const serviceClient = getServiceClient()
  
  console.log('Fetching profile for username:', params.username)
  
  // Get current user (if logged in)
  const { data: { session } } = await supabase.auth.getSession()
  
  // Fetch user profile - case insensitive search
  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('*')
    .ilike('username', params.username)
    .single()
  
  if (profileError) {
    console.error('Profile lookup error:', profileError)
    return NextResponse.json<ApiResponse<null>>({
      error: `User not found: ${profileError.message}`
    }, { status: 404 })
  }
  
  if (!profile) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'User not found'
    }, { status: 404 })
  }
  
  console.log('Found profile:', profile.username, profile.subscription_tier)
  
  // Fetch user stats from formulas
  const { data: formulas } = await serviceClient
    .from('formulas')
    .select('id, is_public, total_matches, wins, win_rate')
    .eq('user_id', profile.id)
  
  const totalFormulas = formulas?.length || 0
  const publicFormulas = formulas?.filter(f => f.is_public).length || 0
  const totalMatches = formulas?.reduce((sum, f) => sum + (f.total_matches || 0), 0) || 0
  const totalWins = formulas?.reduce((sum, f) => sum + (f.wins || 0), 0) || 0
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0
  
  // Fetch clan membership
  const { data: membership } = await serviceClient
    .from('clan_members')
    .select(`
      clan:clans(name, slug, logo_url)
    `)
    .eq('user_id', profile.id)
    .single()
  
  // Fetch wallet stats if wallet is linked and verified
  let walletStats = null
  if (profile.wallet_address && profile.wallet_verified) {
    const { data: stats } = await serviceClient
      .from('wallet_stats')
      .select('total_pnl_usd, realized_pnl_usd, unrealized_pnl_usd, total_tokens_traded, total_transactions, winning_tokens, losing_tokens, win_rate, best_trade_token, best_trade_pnl, worst_trade_token, worst_trade_pnl, last_refreshed_at')
      .eq('user_id', profile.id)
      .maybeSingle()
    
    walletStats = stats
  }
  
  // Build response
  const publicProfile: PublicProfile = {
    ...profile,
    // Hide email for non-owners
    email: session?.user?.id === profile.id ? profile.email : '',
    // Hide wallet address partially (show first 4 + last 4)
    wallet_address: profile.wallet_address 
      ? `${profile.wallet_address.slice(0, 4)}...${profile.wallet_address.slice(-4)}`
      : null,
    subscription_tier: profile.subscription_tier || 'free',
    badges: profile.badges || [],
    total_matches: totalMatches,
    total_wins: totalWins,
    win_rate: winRate,
    total_formulas: totalFormulas,
    public_formulas: publicFormulas,
    clan: membership?.clan || null,
    is_own_profile: session?.user?.id === profile.id,
    wallet_stats: walletStats,
  }
  
  return NextResponse.json<ApiResponse<PublicProfile>>({
    data: publicProfile
  })
}
