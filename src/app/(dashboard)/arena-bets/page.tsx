'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import {
  TrendingUp, TrendingDown, Clock, Zap, Target, Gift,
  ExternalLink, Loader2, ChevronDown, Flame, SkullIcon, Rocket
} from 'lucide-react'
import Link from 'next/link'

// =============================================
// TYPES
// =============================================

interface Market {
  id: string
  token_address: string
  token_name: string
  token_symbol: string
  market_type: 'up_down' | 'rug_call' | 'moonshot'
  question: string
  description: string | null
  price_at_creation: number
  price_at_resolution: number | null
  resolve_at: string
  resolved_at: string | null
  outcome: 'yes' | 'no' | null
  status: 'active' | 'resolved' | 'cancelled'
  total_pool: number
  yes_pool: number
  no_pool: number
  total_bettors: number
  bot_predictions: Record<string, string>
  dexscreener_url: string | null
  liquidity: number | null
  rugcheck_score: number | null
  created_at: string
  user_bet?: {
    id: string
    position: 'yes' | 'no'
    amount: number
    payout: number
    is_winner: boolean | null
  } | null
  time_remaining?: number
}

interface PointsData {
  balance: number
  total_earned: number
  total_wagered: number
  total_won: number
  win_count: number
  loss_count: number
  current_streak: number
  best_streak: number
  last_daily_claim: string | null
}

// =============================================
// HELPERS
// =============================================

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Resolving...'
  const mins = Math.floor(ms / 60000)
  const hrs = Math.floor(mins / 60)
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  if (mins > 0) return `${mins}m`
  return `${Math.ceil(ms / 1000)}s`
}

function formatPoints(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function getMarketTypeIcon(type: string) {
  switch (type) {
    case 'rug_call': return <SkullIcon size={14} />
    case 'moonshot': return <Rocket size={14} />
    default: return <TrendingUp size={14} />
  }
}

function getMarketTypeColor(type: string): string {
  switch (type) {
    case 'rug_call': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'moonshot': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
    default: return 'text-arena-cyan bg-arena-cyan/10 border-arena-cyan/20'
  }
}

function getMarketTypeLabel(type: string): string {
  switch (type) {
    case 'rug_call': return 'RUG CALL'
    case 'moonshot': return 'MOONSHOT'
    case 'up_down': return 'UP / DOWN'
    default: return type.toUpperCase()
  }
}

// =============================================
// COMPONENTS
// =============================================

function PointsBar({
  points,
  onClaimDaily,
  claimLoading,
  claimMessage,
}: {
  points: PointsData | null
  onClaimDaily: () => void
  claimLoading: boolean
  claimMessage: string | null
}) {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Balance</p>
          <p className="text-2xl font-bold text-white">
            {points ? formatPoints(points.balance) : '—'}{' '}
            <span className="text-sm text-arena-cyan font-normal">pts</span>
          </p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-white/10" />
        <div className="hidden sm:flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">W/L </span>
            <span className="text-green-400">{points?.win_count ?? 0}</span>
            <span className="text-gray-600">/</span>
            <span className="text-red-400">{points?.loss_count ?? 0}</span>
          </div>
          {(points?.current_streak ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-orange-400 font-medium">{points?.current_streak} streak</span>
            </div>
          )}
          {(points?.best_streak ?? 0) >= 3 && (
            <div className="text-gray-500">
              Best: <span className="text-gray-300">{points?.best_streak}</span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onClaimDaily}
        disabled={claimLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-arena-purple to-arena-cyan text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {claimLoading ? <Loader2 size={14} className="animate-spin" /> : <Gift size={14} />}
        {claimMessage || 'Claim Daily +100'}
      </button>
    </div>
  )
}

function MarketCard({
  market,
  onBet,
  betting,
}: {
  market: Market
  onBet: (marketId: string, position: 'yes' | 'no', amount: number) => void
  betting: string | null
}) {
  const [betAmount, setBetAmount] = useState(50)
  const [expanded, setExpanded] = useState(false)
  const timeLeft = market.time_remaining ?? (new Date(market.resolve_at).getTime() - Date.now())
  const isExpired = timeLeft <= 0
  const hasBet = !!market.user_bet
  const isResolved = market.status === 'resolved'
  const totalPool = market.total_pool || 0

  const yesPercent = totalPool > 0 ? Math.round((market.yes_pool / totalPool) * 100) : 50
  const noPercent = totalPool > 0 ? 100 - yesPercent : 50

  // Potential payout calculation (pari-mutuel estimate)
  const estimateYesPayout = market.yes_pool > 0
    ? ((betAmount / (market.yes_pool + betAmount)) * (market.no_pool + betAmount + market.yes_pool)).toFixed(0)
    : (betAmount * 2).toString()
  const estimateNoPayout = market.no_pool > 0
    ? ((betAmount / (market.no_pool + betAmount)) * (market.yes_pool + betAmount + market.no_pool)).toFixed(0)
    : (betAmount * 2).toString()

  return (
    <Card className="!p-0 overflow-hidden group" hover>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getMarketTypeColor(market.market_type)}`}>
              {getMarketTypeIcon(market.market_type)}
              {getMarketTypeLabel(market.market_type)}
            </span>
            <span className="text-xs text-gray-500 font-mono">${market.token_symbol}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {!isResolved && !isExpired && (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock size={12} />
                {formatTimeLeft(timeLeft)}
              </span>
            )}
            {isResolved && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                market.outcome === 'yes'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {market.outcome === 'yes' ? 'YES' : 'NO'}
              </span>
            )}
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white leading-snug mb-2">{market.question}</h3>

        {/* Bot predictions */}
        {Object.keys(market.bot_predictions || {}).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(market.bot_predictions).map(([bot, pred]) => (
              <span
                key={bot}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                  pred === 'yes'
                    ? 'border-green-500/20 bg-green-500/5 text-green-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}
              >
                <span className="bg-arena-purple/30 text-arena-purple px-1 rounded text-[9px]">AI</span>
                {bot.replace('ArenaBot_', '')}:{' '}
                <span className="font-bold">{(pred as string).toUpperCase()}</span>
              </span>
            ))}
          </div>
        )}

        {/* Pool bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>YES {yesPercent}%</span>
            <span>{formatPoints(totalPool)} pts pool</span>
            <span>NO {noPercent}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-white/5 flex">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${yesPercent}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bet area / result */}
      <div className="border-t border-white/5 p-4 pt-3 bg-white/[0.01]">
        {isResolved && hasBet && (
          <div className={`flex items-center justify-between text-sm ${
            market.user_bet!.is_winner ? 'text-green-400' : 'text-red-400'
          }`}>
            <span>
              You bet <strong>{market.user_bet!.amount} pts</strong> on{' '}
              <strong>{market.user_bet!.position.toUpperCase()}</strong>
            </span>
            <span className="font-bold">
              {market.user_bet!.is_winner
                ? `+${market.user_bet!.payout - market.user_bet!.amount} pts`
                : `-${market.user_bet!.amount} pts`
              }
            </span>
          </div>
        )}

        {isResolved && !hasBet && (
          <p className="text-xs text-gray-500 text-center">You didn&apos;t bet on this market.</p>
        )}

        {!isResolved && hasBet && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              You bet <strong className="text-white">{market.user_bet!.amount} pts</strong> on{' '}
              <strong className={market.user_bet!.position === 'yes' ? 'text-green-400' : 'text-red-400'}>
                {market.user_bet!.position.toUpperCase()}
              </strong>
            </span>
            <span className="text-xs text-gray-500">Awaiting resolution</span>
          </div>
        )}

        {!isResolved && !hasBet && !isExpired && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-white transition-colors mb-2"
            >
              Place Bet <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {expanded && (
              <div className="space-y-3">
                {/* Amount selector */}
                <div className="flex items-center gap-2">
                  {[25, 50, 100, 250].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                        betAmount === amt
                          ? 'bg-arena-purple/30 text-arena-purple border border-arena-purple/40'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                {/* Yes/No buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBet(market.id, 'yes', betAmount)}
                    disabled={betting === market.id}
                    className="flex flex-col items-center gap-0.5 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                  >
                    {betting === market.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span className="text-sm font-bold">YES</span>
                        <span className="text-[10px] text-green-500/70">~{estimateYesPayout} pts</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onBet(market.id, 'no', betAmount)}
                    disabled={betting === market.id}
                    className="flex flex-col items-center gap-0.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {betting === market.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <span className="text-sm font-bold">NO</span>
                        <span className="text-[10px] text-red-500/70">~{estimateNoPayout} pts</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* DexScreener link */}
        {market.dexscreener_url && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <a
              href={market.dexscreener_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              <ExternalLink size={10} />
              DexScreener
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}

// =============================================
// MAIN PAGE
// =============================================

export default function ArenaBetsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [points, setPoints] = useState<PointsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [betting, setBetting] = useState<string | null>(null)
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimMessage, setClaimMessage] = useState<string | null>(null)
  const [tab, setTab] = useState<'active' | 'resolved'>('active')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchMarkets = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: tab, limit: '30' })
      if (typeFilter !== 'all') params.set('type', typeFilter)

      const res = await fetch(`/api/arena-bets/markets?${params}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setMarkets(data.data || [])
      if (data.balance !== undefined && points) {
        setPoints(prev => prev ? { ...prev, balance: data.balance } : prev)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, typeFilter])

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch('/api/arena-bets/points')
      const data = await res.json()
      if (data.data) setPoints(data.data)
    } catch {}
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchMarkets()
    fetchPoints()
  }, [tab, typeFilter, fetchMarkets, fetchPoints])

  // Auto-refresh active markets every 30 seconds
  useEffect(() => {
    if (tab === 'active') {
      pollRef.current = setInterval(fetchMarkets, 30000)
      return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }
  }, [tab, fetchMarkets])

  const handleBet = async (marketId: string, position: 'yes' | 'no', amount: number) => {
    setBetting(marketId)
    setError(null)
    try {
      const res = await fetch('/api/arena-bets/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market_id: marketId, position, amount }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        if (data.balance !== undefined) {
          setPoints(prev => prev ? { ...prev, balance: data.balance } : prev)
        }
        fetchMarkets() // Refresh to get updated pools
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBetting(null)
    }
  }

  const handleClaimDaily = async () => {
    setClaimLoading(true)
    setClaimMessage(null)
    try {
      const res = await fetch('/api/arena-bets/points', { method: 'POST' })
      const data = await res.json()
      setClaimMessage(data.message)
      if (data.success) {
        setPoints(prev => prev ? { ...prev, balance: data.balance } : prev)
        setTimeout(() => setClaimMessage(null), 3000)
      }
    } catch {
      setClaimMessage('Failed to claim')
    } finally {
      setClaimLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Arena Bets</h1>
        <p className="text-gray-400 text-sm mt-1">
          Predict memecoin moves. Earn points. Climb the ranks.
        </p>
      </div>

      {/* Points Bar */}
      <PointsBar
        points={points}
        onClaimDaily={handleClaimDaily}
        claimLoading={claimLoading}
        claimMessage={claimMessage}
      />

      {/* Error banner */}
      {error && (
        <div className="glass-card rounded-lg p-3 border border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs + Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
          {[
            { key: 'active', label: 'Live Markets' },
            { key: 'resolved', label: 'Resolved' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-arena-purple/20 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'up_down', label: 'Up/Down' },
            { key: 'rug_call', label: 'Rug Call' },
            { key: 'moonshot', label: 'Moonshot' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                typeFilter === f.key
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-arena-purple" />
        </div>
      ) : markets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target size={32} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">
              {tab === 'active'
                ? 'No live markets right now. Markets are auto-generated from token activity — check back soon.'
                : 'No resolved markets yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onBet={handleBet}
              betting={betting}
            />
          ))}
        </div>
      )}

      {/* How it works (below fold) */}
      <Card className="!bg-white/[0.01]">
        <CardContent className="py-6 px-6">
          <h3 className="text-sm font-semibold text-white mb-4">How Arena Bets Work</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-400">
            <div>
              <p className="text-white font-medium mb-1">1. Markets auto-generate</p>
              <p>When our scanners detect an interesting token, a prediction market is created with a 15-min to 4-hour resolution window.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-1">2. Place your bet</p>
              <p>Bet YES or NO using DegenArena points. Arena Bots place their own AI predictions so you can see who agrees or disagrees.</p>
            </div>
            <div>
              <p className="text-white font-medium mb-1">3. Winner takes the pool</p>
              <p>When the market resolves, the losing side&apos;s pool is distributed to winners proportionally. Build streaks to unlock badges.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
