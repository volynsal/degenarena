'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { 
  ArrowLeft,
  Users, 
  Trophy,
  Target,
  Loader2,
  Calendar,
  Shield,
  Zap,
  ExternalLink
} from 'lucide-react'

// Twitch icon component
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
)
import { BADGE_DEFINITIONS, RARITY_COLORS, TIER_INFO, BADGE_CATEGORIES, getBadge } from '@/lib/badges'
import type { EarnedBadge, SubscriptionTier } from '@/types/database'

interface WalletStatsData {
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
}

interface ProfileData {
  id: string
  username: string
  email: string
  avatar_url: string | null
  bio: string | null
  twitch_url: string | null
  wallet_address: string | null
  wallet_verified: boolean
  subscription_tier: SubscriptionTier
  badges: EarnedBadge[]
  created_at: string
  total_matches: number
  total_wins: number
  win_rate: number
  total_formulas: number
  public_formulas: number
  clan: {
    name: string
    slug: string
    logo_url: string | null
  } | null
  is_own_profile: boolean
  wallet_stats: WalletStatsData | null
}

interface TwitchStreamInfo {
  isLive: boolean
  title?: string
  viewerCount?: number
  gameName?: string
  startedAt?: string
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamInfo, setStreamInfo] = useState<TwitchStreamInfo | null>(null)
  
  useEffect(() => {
    fetchProfile()
  }, [params.username])
  
  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/users/${params.username}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'User not found')
      }
      
      setProfile(data.data)
      
      // Check Twitch live status if user has a Twitch URL
      if (data.data?.twitch_url) {
        try {
          const liveRes = await fetch(`/api/twitch/live?username=${params.username}`)
          const liveData = await liveRes.json()
          if (liveData.data?.[0]?.stream) {
            setStreamInfo(liveData.data[0].stream)
          }
        } catch {
          // Non-critical - silently fail
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h1 className="text-xl font-bold text-white mb-2">User Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This user does not exist.'}</p>
            <Link href="/leaderboard">
              <button className="px-4 py-2 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-lg text-white text-sm font-medium">
                Browse Leaderboard
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const tierInfo = TIER_INFO[profile.subscription_tier]
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
  
  // Group badges by category
  const badgesByCategory = profile.badges.reduce((acc, earned) => {
    const badge = getBadge(earned.id)
    if (badge) {
      if (!acc[badge.category]) acc[badge.category] = []
      acc[badge.category].push({ ...badge, earned_at: earned.earned_at })
    }
    return acc
  }, {} as Record<string, Array<typeof BADGE_DEFINITIONS[string] & { earned_at: string }>>)
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Link href="/leaderboard">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
      
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-3xl font-bold text-white overflow-hidden flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                profile.username.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Username + Verified + Tier Badge + Twitch */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">@{profile.username}</h1>
                {profile.wallet_verified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 border border-green-500/30 text-green-400" title="Verified on-chain trader">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <span>Verified Trader</span>
                  </span>
                )}
                {profile.subscription_tier !== 'free' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${tierInfo.color}`}>
                    <span>{tierInfo.icon}</span>
                    <span>{tierInfo.name}</span>
                  </span>
                )}
                {profile.twitch_url && (
                  <a
                    href={profile.twitch_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      streamInfo?.isLive
                        ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                        : 'bg-[#9146FF]/20 border border-[#9146FF]/30 text-[#9146FF] hover:bg-[#9146FF]/30'
                    }`}
                    title={streamInfo?.isLive ? `LIVE: ${streamInfo.title || 'Streaming'}` : 'Watch on Twitch'}
                  >
                    {streamInfo?.isLive && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <TwitchIcon className="w-4 h-4" />
                    <span>{streamInfo?.isLive ? 'LIVE' : 'Twitch'}</span>
                    {streamInfo?.isLive && streamInfo.viewerCount !== undefined && (
                      <span className="text-xs opacity-75">{streamInfo.viewerCount}</span>
                    )}
                    {!streamInfo?.isLive && <ExternalLink className="w-3 h-3" />}
                  </a>
                )}
              </div>
              
              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-400 mb-3">{profile.bio}</p>
              )}
              
              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {memberSince}</span>
                </div>
                {profile.clan && (
                  <Link 
                    href={`/clans/${profile.clan.slug}`}
                    className="flex items-center gap-1.5 text-arena-purple hover:text-arena-cyan transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{profile.clan.name}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Twitch Stream Embed - shown when live */}
      {streamInfo?.isLive && profile.twitch_url && (() => {
        // Extract Twitch username from URL for embed
        const twitchUser = profile.twitch_url!.replace(/https?:\/\/(www\.)?twitch\.tv\//i, '').split('/')[0].split('?')[0]
        const parentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        return (
          <Card className="overflow-hidden border-red-500/30">
            <CardContent className="p-0">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border-b border-red-500/20">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium text-red-400">LIVE</span>
                {streamInfo.title && (
                  <span className="text-sm text-gray-400 truncate">&mdash; {streamInfo.title}</span>
                )}
                {streamInfo.viewerCount !== undefined && (
                  <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {streamInfo.viewerCount.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://player.twitch.tv/?channel=${twitchUser}&parent=${parentDomain}&muted=true`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        )
      })()}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto mb-2 text-arena-cyan" />
            <p className="text-2xl font-bold text-white">{profile.total_formulas}</p>
            <p className="text-xs sm:text-sm text-gray-500">Formulas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold text-white">{profile.total_matches}</p>
            <p className="text-xs sm:text-sm text-gray-500">Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-white">{profile.total_wins}</p>
            <p className="text-xs sm:text-sm text-gray-500">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-arena-purple" />
            <p className="text-2xl font-bold text-white">{profile.win_rate}%</p>
            <p className="text-xs sm:text-sm text-gray-500">Win Rate</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Wallet Stats - shown if verified */}
      {profile.wallet_verified && profile.wallet_stats && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span>On-Chain Performance</span>
              {profile.wallet_address && (
                <span className="text-xs font-mono text-gray-500 font-normal">
                  {profile.wallet_address}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Total PnL</p>
                <p className={`text-lg font-bold ${profile.wallet_stats.total_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${profile.wallet_stats.total_pnl_usd >= 0 ? '+' : ''}{Number(profile.wallet_stats.total_pnl_usd).toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Win Rate</p>
                <p className="text-lg font-bold text-white">{profile.wallet_stats.win_rate}%</p>
                <p className="text-xs text-gray-600">{profile.wallet_stats.winning_tokens}W / {profile.wallet_stats.losing_tokens}L</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Tokens Traded</p>
                <p className="text-lg font-bold text-white">{profile.wallet_stats.total_tokens_traded}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="text-xs text-gray-500 mb-1">Total Trades</p>
                <p className="text-lg font-bold text-white">{profile.wallet_stats.total_transactions}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {profile.wallet_stats.best_trade_token && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <p className="text-xs text-gray-500 mb-1">Best Trade</p>
                  <p className="text-sm font-medium text-green-400">
                    {profile.wallet_stats.best_trade_token}
                  </p>
                  <p className="text-xs text-green-400/70">
                    +${Number(profile.wallet_stats.best_trade_pnl).toFixed(2)}
                  </p>
                </div>
              )}
              {profile.wallet_stats.worst_trade_token && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-gray-500 mb-1">Worst Trade</p>
                  <p className="text-sm font-medium text-red-400">
                    {profile.wallet_stats.worst_trade_token}
                  </p>
                  <p className="text-xs text-red-400/70">
                    ${Number(profile.wallet_stats.worst_trade_pnl).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-600 mt-3">
              Last updated {new Date(profile.wallet_stats.last_refreshed_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏅</span>
            <span>Badges</span>
            <span className="text-sm font-normal text-gray-500">
              ({profile.badges.length} earned)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.badges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No badges earned yet</p>
              <p className="text-sm text-gray-600 mt-1">
                {profile.is_own_profile 
                  ? 'Complete achievements to earn badges!'
                  : 'This user hasn\'t earned any badges yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(BADGE_CATEGORIES).map(([category, label]) => {
                const badges = badgesByCategory[category]
                if (!badges || badges.length === 0) return null
                
                return (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">{label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <div
                          key={badge.id}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${RARITY_COLORS[badge.rarity]}`}
                          title={`${badge.description} - Earned ${new Date(badge.earned_at).toLocaleDateString()}`}
                        >
                          <span className="text-lg">{badge.icon}</span>
                          <span className="text-sm font-medium">{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Public Formulas (if any) */}
      {profile.public_formulas > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Public Formulas ({profile.public_formulas})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">
              View this user&apos;s public formulas on the leaderboard.
            </p>
            <Link 
              href="/leaderboard"
              className="inline-block mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
            >
              Browse Leaderboard
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
