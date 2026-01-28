'use client'

import { useUserStats } from '@/lib/hooks/use-user-stats'
import { useRecentMatches } from '@/lib/hooks/use-matches'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, Target, Trophy, Zap, ArrowUpRight, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
        <h1 className="text-3xl sm:text-4xl font-bold not-italic bg-gradient-to-r from-white via-arena-cyan to-arena-purple bg-clip-text text-transparent leading-tight pb-2">
          Dashboard
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Overview of your formula performance</p>
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
