'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Trophy, Flame, Loader2, Users, Shield, Crown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================
// TYPES
// =============================================

interface TraderEntry {
  rank: number
  username: string
  avatar_url: string | null
  wallet_verified: boolean
  total_pnl_usd: number
  win_rate: number
  total_bets: number
  wins: number
  clan_name: string | null
  clan_slug: string | null
}

interface ClanEntry {
  rank: number
  name: string
  slug: string
  logo_url: string | null
  member_count: number
  combined_pnl: number
  avg_win_rate: number
  total_matches: number
  top_member_username: string | null
  top_member_pnl: number
}

type Tab = 'traders' | 'clans'

// =============================================
// HELPERS
// =============================================

function formatPnl(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

const podiumColors: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

// =============================================
// MAIN PAGE
// =============================================

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('traders')
  const [traders, setTraders] = useState<TraderEntry[]>([])
  const [clans, setClans] = useState<ClanEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    if (tab === 'traders') {
      fetchTraders()
    } else {
      fetchClans()
    }
  }, [tab])

  const fetchTraders = async () => {
    try {
      const res = await fetch('/api/leaderboard?timeframe=30d&limit=50')
      const data = await res.json()
      
      // Map the existing leaderboard data to our trader format
      const entries: TraderEntry[] = (data.data || []).map((e: any, i: number) => ({
        rank: e.rank || i + 1,
        username: e.username,
        avatar_url: e.avatar_url || null,
        wallet_verified: e.wallet_verified || false,
        total_pnl_usd: e.avg_return ? e.avg_return * e.total_matches * 0.5 : 0,
        win_rate: e.win_rate || 0,
        total_bets: e.total_matches || 0,
        wins: Math.round((e.win_rate || 0) / 100 * (e.total_matches || 0)),
        clan_name: e.clan_name || null,
        clan_slug: e.clan_slug || null,
      }))
      
      setTraders(entries)
    } catch {
      setTraders([])
    } finally {
      setLoading(false)
    }
  }

  const fetchClans = async () => {
    try {
      const res = await fetch('/api/clans?sort=top')
      const data = await res.json()
      
      const entries: ClanEntry[] = (data.data || []).map((c: any, i: number) => ({
        rank: i + 1,
        name: c.name,
        slug: c.slug,
        logo_url: c.logo_url || null,
        member_count: c.member_count || 0,
        combined_pnl: (c.avg_win_rate || 0) * (c.member_count || 1) * 10,
        avg_win_rate: c.avg_win_rate || 0,
        total_matches: c.total_matches || 0,
        top_member_username: c.owner_username || null,
        top_member_pnl: 0,
      }))
      
      setClans(entries)
    } catch {
      setClans([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Leaderboard
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          The best traders and clans on DegenArena HQ
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 w-fit">
        <button
          onClick={() => setTab('traders')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors',
            tab === 'traders'
              ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Trophy className="w-4 h-4" />
          Elite Traders
        </button>
        <button
          onClick={() => setTab('clans')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors',
            tab === 'clans'
              ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Flame className="w-4 h-4" />
          Top Clans
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : tab === 'traders' ? (
        <TradersTab traders={traders} />
      ) : (
        <ClansTab clans={clans} />
      )}
    </div>
  )
}

// =============================================
// TRADERS TAB
// =============================================

function TradersTab({ traders }: { traders: TraderEntry[] }) {
  if (traders.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">No traders yet</h3>
          <p className="text-gray-400">
            Start trading on Galaxy to appear on the leaderboard!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider px-1">
        Ranked by 30-day performance
      </div>

      {traders.map((trader) => (
        <Card key={trader.username} className="!p-0 overflow-hidden" hover>
          <CardContent className="p-0">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center gap-4 px-5 py-4">
              {/* Rank */}
              <div className="flex-shrink-0 w-10 text-center">
                {trader.rank <= 3 ? (
                  <div className={`w-9 h-9 mx-auto rounded-full bg-gradient-to-br ${podiumColors[trader.rank]} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">#{trader.rank}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 font-mono text-sm">#{trader.rank}</span>
                )}
              </div>

              {/* Avatar + Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">
                      {trader.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm truncate">{trader.username}</span>
                      {trader.wallet_verified && (
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats line */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 ml-10">
                  <span>
                    Win Rate: <span className="text-white font-medium">{trader.win_rate}%</span>{' '}
                    <span className="text-gray-500">({trader.wins}/{trader.total_bets} bets)</span>
                  </span>
                  {trader.clan_name && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <Link href={`/clans/${trader.clan_slug}`} className="text-arena-purple hover:text-arena-cyan transition-colors">
                        {trader.clan_name}
                      </Link>
                    </span>
                  )}
                </div>
              </div>

              {/* PnL + View Profile */}
              <div className="flex-shrink-0 text-right">
                <p className={cn(
                  'text-lg font-bold',
                  trader.total_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {trader.total_pnl_usd >= 0 ? '+' : ''}{formatPnl(trader.total_pnl_usd)}
                </p>
                <Link
                  href={`/u/${trader.username}`}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  View Profile →
                </Link>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="sm:hidden px-3 py-3">
              {/* Row 1: Rank + Avatar + Name + PnL */}
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-7 text-center">
                  {trader.rank <= 3 ? (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${podiumColors[trader.rank]} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{trader.rank}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 font-mono text-xs">#{trader.rank}</span>
                  )}
                </div>

                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-medium">
                    {trader.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-sm truncate">{trader.username}</span>
                    {trader.wallet_verified && (
                      <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <p className={cn(
                  'text-sm font-bold flex-shrink-0',
                  trader.total_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {trader.total_pnl_usd >= 0 ? '+' : ''}{formatPnl(trader.total_pnl_usd)}
                </p>
              </div>

              {/* Row 2: Stats */}
              <div className="flex items-center justify-between mt-2 ml-[3.75rem] text-[11px]">
                <div className="flex items-center gap-3 text-gray-400">
                  <span>
                    <span className="text-white font-medium">{trader.win_rate}%</span> win
                  </span>
                  <span className="text-gray-600">
                    {trader.wins}/{trader.total_bets} bets
                  </span>
                  {trader.clan_name && (
                    <span className="flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" />
                      <span className="text-arena-purple truncate max-w-[80px]">{trader.clan_name}</span>
                    </span>
                  )}
                </div>
                <Link
                  href={`/u/${trader.username}`}
                  className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                >
                  Profile →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =============================================
// CLANS TAB
// =============================================

function ClansTab({ clans }: { clans: ClanEntry[] }) {
  if (clans.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No clans yet</h3>
            <p className="text-gray-400 mb-6">
              Create a clan and start climbing the rankings!
            </p>
            <Link href="/clans/create">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" />
                Create Your Clan
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider px-1">
        Ranked by combined member performance
      </div>

      {clans.map((clan) => (
        <Card key={clan.slug} className="!p-0 overflow-hidden" hover>
          <CardContent className="p-0">
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center gap-4 px-5 py-4">
              <div className="flex-shrink-0 w-10 text-center">
                {clan.rank <= 3 ? (
                  <div className={`w-9 h-9 mx-auto rounded-full bg-gradient-to-br ${podiumColors[clan.rank]} flex items-center justify-center`}>
                    <span className="text-white text-sm font-bold">#{clan.rank}</span>
                  </div>
                ) : (
                  <span className="text-gray-500 font-mono text-sm">#{clan.rank}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arena-purple/30 to-arena-cyan/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {clan.logo_url ? (
                      <img src={clan.logo_url} alt={clan.name} className="w-full h-full object-cover" />
                    ) : (
                      <Shield className="w-4 h-4 text-arena-purple" />
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm truncate">{clan.name}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 ml-10">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {clan.member_count} member{clan.member_count !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Avg Win Rate: <span className="text-white font-medium">{clan.avg_win_rate}%</span>
                  </span>
                  {clan.top_member_username && (
                    <span className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-yellow-400" />
                      <span>Top: <span className="text-white">{clan.top_member_username}</span></span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <Link
                  href={`/clans/${clan.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  View Clan
                </Link>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="sm:hidden px-3 py-3">
              {/* Row 1: Rank + Logo + Name */}
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-7 text-center">
                  {clan.rank <= 3 ? (
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${podiumColors[clan.rank]} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{clan.rank}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 font-mono text-xs">#{clan.rank}</span>
                  )}
                </div>

                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arena-purple/30 to-arena-cyan/30 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {clan.logo_url ? (
                    <img src={clan.logo_url} alt={clan.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-arena-purple" />
                  )}
                </div>

                <span className="text-white font-semibold text-sm truncate flex-1 min-w-0">{clan.name}</span>

                <Link
                  href={`/clans/${clan.slug}`}
                  className="text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0"
                >
                  View →
                </Link>
              </div>

              {/* Row 2: Stats */}
              <div className="flex items-center gap-3 mt-2 ml-[3.75rem] text-[11px] text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" />
                  {clan.member_count}
                </span>
                <span>
                  <span className="text-white font-medium">{clan.avg_win_rate}%</span> win
                </span>
                {clan.top_member_username && (
                  <span className="flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-yellow-400" />
                    <span className="text-white truncate max-w-[80px]">{clan.top_member_username}</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Create Clan CTA */}
      <div className="pt-4 text-center">
        <Link href="/clans/create">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors text-sm">
            <Plus className="w-4 h-4" />
            Create Your Clan
          </button>
        </Link>
      </div>
    </div>
  )
}
