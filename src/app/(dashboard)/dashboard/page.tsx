'use client'

import { useState, useEffect } from 'react'
import { useUserStats } from '@/lib/hooks/use-user-stats'
import { useRecentMatches } from '@/lib/hooks/use-matches'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Target, Trophy, Zap, ArrowUpRight, ExternalLink, Loader2, Radio, Orbit } from 'lucide-react'
import Link from 'next/link'

// Twitch icon component
const TwitchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
  </svg>
)

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

export default function DashboardPage() {
  const { stats, isLoading: statsLoading } = useUserStats()
  const { matches, isLoading: matchesLoading } = useRecentMatches(5)
  const [liveCount, setLiveCount] = useState(0)
  const [userTwitchUrl, setUserTwitchUrl] = useState<string | null>(null)
  
  useEffect(() => {
    // Fetch live count for the live widget
    fetch('/api/twitch/live')
      .then(r => r.json())
      .then(d => setLiveCount(d.data?.length || 0))
      .catch(() => {})
    // Check if user has Twitch connected
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.data?.twitch_url) setUserTwitchUrl(d.data.twitch_url) })
      .catch(() => {})
  }, [])
  
  const statsData = [
    {
      title: 'Total Matches',
      value: stats?.total_matches ?? 0,
      icon: Target,
    },
    {
      title: 'Win Rate',
      value: stats?.overall_win_rate ? `${stats.overall_win_rate}%` : '0%',
      icon: TrendingUp,
    },
    {
      title: 'Leaderboard Rank',
      value: stats?.leaderboard_rank ? `#${stats.leaderboard_rank}` : '—',
      icon: Trophy,
    },
    {
      title: 'Active Formulas',
      value: stats?.active_formulas ?? 0,
      icon: Zap,
    },
  ]
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold gradient-text">
          Home
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Your command center</p>
      </div>
      
      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.title} hover>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  {statsLoading ? (
                    <div className="h-8 w-16 bg-white/5 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-arena-purple/20 to-arena-cyan/20 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-arena-cyan" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Live & Go Live widget */}
      <Card className="border-[#9146FF]/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9146FF]/20 flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-[#9146FF]" />
              </div>
              <div>
                <p className="text-white font-medium">Live Streams</p>
                <p className="text-sm text-gray-400">
                  {liveCount > 0
                    ? `${liveCount} trader${liveCount > 1 ? 's' : ''} streaming now`
                    : 'No one is live right now'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-[52px] sm:ml-0">
              <Link
                href="/live"
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white transition-colors"
              >
                {liveCount > 0 ? 'Watch' : 'View'}
              </Link>
              {userTwitchUrl ? (
                <a
                  href="https://dashboard.twitch.tv/stream-manager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#9146FF] hover:bg-[#7c3aed] text-white text-sm font-medium transition-colors"
                >
                  <TwitchIcon className="w-3.5 h-3.5" />
                  Go Live
                </a>
              ) : (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <TwitchIcon className="w-3.5 h-3.5" />
                  Connect
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* GalaxyArena widget */}
      <Card className="border-rose-500/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-violet-500/20 flex items-center justify-center">
                <Orbit className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-white font-medium">GalaxyArena</p>
                <p className="text-sm text-gray-400">
                  Predict memecoin moves, earn points
                </p>
              </div>
            </div>
            <Link
              href="/arena-bets"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3.5 h-3.5" />
              Play Now
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Best formula highlight */}
      {stats?.best_formula && (
        <Card className="border-arena-purple/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Your Best Formula</p>
                <p className="text-lg font-semibold text-white">{stats.best_formula.name}</p>
                <p className="text-arena-cyan font-mono">{stats.best_formula.win_rate}% win rate</p>
              </div>
              <Link 
                href={`/formulas/${stats.best_formula.id}`}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-colors"
              >
                View Formula
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Recent matches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matchesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-arena-cyan animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No matches yet</p>
              <p className="text-sm text-gray-500">
                Create a formula and activate it to start finding tokens
              </p>
              <Link 
                href="/formulas/new" 
                className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-lg text-white text-sm font-medium"
              >
                Create Formula
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/30 to-arena-cyan/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {match.token_symbol.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{match.token_symbol}</p>
                          {match.dexscreener_url && (
                            <a 
                              href={match.dexscreener_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-arena-cyan"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {(match as any).formula?.name || 'Formula'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {match.return_24h !== null && match.return_24h !== undefined ? (
                        <p className={`font-mono font-medium ${
                          match.return_24h >= 0 ? 'text-arena-cyan' : 'text-red-400'
                        }`}>
                          {match.return_24h >= 0 ? '+' : ''}{match.return_24h.toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm">Pending</p>
                      )}
                      <p className="text-sm text-gray-500">{formatTimeAgo(match.matched_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link 
                href="/matches" 
                className="block w-full mt-4 py-2 text-sm text-arena-purple hover:text-arena-cyan transition-colors text-center"
              >
                View all matches →
              </Link>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Quick actions */}
      {(stats?.total_formulas ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Get Started</h3>
            <p className="text-gray-400 mb-4">
              Create your first formula to start finding tokens that match your criteria.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/formulas/new"
                className="px-4 py-2 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-lg text-white text-sm font-medium"
              >
                Create Formula
              </Link>
              <Link 
                href="/leaderboard"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
              >
                Browse Leaderboard
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
