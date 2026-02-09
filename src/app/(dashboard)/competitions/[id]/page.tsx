'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCompetition, useUserXp } from '@/lib/hooks/use-competitions'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Trophy,
  Clock,
  Users,
  Zap,
  Swords,
  ArrowLeft,
  Loader2,
  Timer,
  Shield,
  Target,
  TrendingUp,
  Crown,
  Radio,
  Medal,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TierName } from '@/types/database'
import { TIER_COLORS, TIER_LABELS } from '@/types/database'

// =============================================
// CONFIG
// =============================================

const typeIcons: Record<string, typeof Trophy> = {
  daily_flip: Zap,
  best_call: Target,
  live_trading: Radio,
  clan_war: Shield,
  survivor: Crown,
  weekly: Trophy,
  head_to_head: Swords,
}

const typeLabels: Record<string, string> = {
  daily_flip: '24-Hour Flip',
  best_call: 'Best Call',
  live_trading: 'Live Trading',
  clan_war: 'Clan War',
  survivor: 'Survivor',
  weekly: 'Weekly',
  head_to_head: 'Head-to-Head',
}

const typeColors: Record<string, string> = {
  daily_flip: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  best_call: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  live_trading: 'text-red-400 bg-red-400/10 border-red-400/20',
  clan_war: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  survivor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  weekly: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  head_to_head: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const rankColors: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

// =============================================
// HELPERS
// =============================================

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ended'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
  return `${minutes}m ${secs}s`
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

function TierBadge({ tier }: { tier: TierName }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium',
      TIER_COLORS[tier]
    )}>
      {TIER_LABELS[tier]}
    </span>
  )
}

// =============================================
// MAIN PAGE
// =============================================

export default function CompetitionDetailPage() {
  const params = useParams()
  const id = params.id as string

  const {
    competition,
    leaderboard,
    isLoading,
    isEntering,
    error,
    enterCompetition,
    withdrawFromCompetition,
  } = useCompetition(id)

  const { xp } = useUserXp()
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  // Countdown timer
  useEffect(() => {
    if (competition?.seconds_remaining) {
      setTimeRemaining(competition.seconds_remaining)
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [competition?.seconds_remaining])

  const handleEnter = async () => {
    await enterCompetition()
  }

  const handleWithdraw = async () => {
    if (confirm('Are you sure you want to withdraw from this competition?')) {
      await withdrawFromCompetition()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-2">Competition not found</h3>
        <Link href="/competitions" className="text-rose-400 hover:underline">
          Back to competitions
        </Link>
      </div>
    )
  }

  const TypeIcon = typeIcons[competition.type] || Trophy
  const isLive = competition.live_status === 'live'
  const isUpcoming = competition.live_status === 'upcoming'
  const isEnded = competition.live_status === 'ended'
  const hasEntered = !!competition.my_entry
  const isBestCall = competition.type === 'best_call'
  const isLiveTrading = competition.type === 'live_trading'

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/competitions"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to competitions
      </Link>

      {/* Header card */}
      <Card className={cn(
        'overflow-hidden',
        isLive && 'ring-1 ring-green-500/30'
      )}>
        <CardContent className="p-0">
          {/* Status bar */}
          <div className={cn(
            'h-1',
            isLive ? 'bg-green-500' : isUpcoming ? 'bg-yellow-500' : 'bg-gray-600'
          )} />

          <div className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left: Competition info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-3 rounded-xl border flex-shrink-0',
                    typeColors[competition.type]
                  )}>
                    <TypeIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        typeColors[competition.type]
                      )}>
                        {typeLabels[competition.type]}
                      </span>
                      {isLive && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {competition.tier_requirement && (
                        <TierBadge tier={competition.tier_requirement as TierName} />
                      )}
                      {isLiveTrading && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/20">
                          <Radio className="w-3 h-3" />
                          Twitch Required
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                      {competition.name}
                    </h1>
                    {competition.description && (
                      <p className="text-gray-400 text-sm">{competition.description}</p>
                    )}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                      <Users className="w-3.5 h-3.5" />
                      Participants
                    </div>
                    <p className="text-lg font-bold text-white">
                      {competition.participant_count}
                      {competition.max_participants && (
                        <span className="text-gray-500 text-sm font-normal">
                          /{competition.max_participants}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Duration
                    </div>
                    <p className="text-lg font-bold text-white">24h</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                      <Trophy className="w-3.5 h-3.5" />
                      1st Prize
                    </div>
                    <p className="text-lg font-bold text-yellow-400">
                      {competition.point_prizes?.['1st'] ?? competition.prizes?.['1st'] ?? '—'}
                      {competition.point_prizes?.['1st'] && <span className="text-xs font-normal"> pts</span>}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Ranked By
                    </div>
                    <p className="text-lg font-bold text-white">
                      {isBestCall ? 'Best Trade' : 'Total PnL'}
                    </p>
                    {isLiveTrading && (
                      <p className="text-[10px] text-gray-500 mt-0.5">30 min live required</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Timer and CTA */}
              <div className="lg:w-72 flex-shrink-0">
                {/* Countdown */}
                <div className={cn(
                  'rounded-xl p-4 mb-4 text-center',
                  isLive ? 'bg-green-500/10 border border-green-500/20' :
                  isUpcoming ? 'bg-yellow-500/10 border border-yellow-500/20' :
                  'bg-gray-500/10 border border-gray-500/20'
                )}>
                  <p className={cn(
                    'text-xs font-medium mb-1 uppercase tracking-wider',
                    isLive ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-gray-400'
                  )}>
                    {isLive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Competition Ended'}
                  </p>
                  <p className={cn(
                    'text-2xl font-mono font-bold',
                    isLive ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-gray-400'
                  )}>
                    {isEnded ? 'Finished' : formatTimeRemaining(timeRemaining)}
                  </p>
                </div>

                {/* Entry section */}
                {!isEnded && (
                  <div className="space-y-3">
                    {hasEntered ? (
                      <>
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-rose-400 mb-1">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">You're in!</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {isLiveTrading
                              ? 'Go Live on Twitch and trade. Your PnL is tracked while you stream.'
                              : 'Your verified wallet PnL is being tracked.'}
                          </p>
                          {isLiveTrading && competition.my_entry?.live_minutes != null && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                              <Radio className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-xs text-gray-300">
                                <span className="font-medium text-purple-400">
                                  {competition.my_entry.live_minutes}
                                </span> min live
                                {(competition.my_entry.live_minutes ?? 0) < 30 && (
                                  <span className="text-gray-500 ml-1">(30 min required)</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        {isUpcoming && (
                          <Button
                            variant="ghost"
                            className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            onClick={handleWithdraw}
                            disabled={isEntering}
                          >
                            {isEntering ? 'Withdrawing...' : 'Withdraw Entry'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={handleEnter}
                          disabled={isEntering || isEnded}
                        >
                          {isEntering ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Entering...
                            </>
                          ) : (
                            'Enter Competition'
                          )}
                        </Button>
                        <p className="text-[11px] text-gray-500 text-center">
                          {isLiveTrading
                            ? 'Requires Twitch connected in Settings. Stream 30+ min to qualify.'
                            : 'Requires a verified wallet. PnL is tracked from entry.'}
                        </p>
                        {error && (
                          <p className="text-red-400 text-sm text-center">{error}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-400" />
              Leaderboard
              {isLive && (
                <span className="text-[10px] text-gray-500 font-normal ml-auto">Updates every 60s</span>
              )}
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400 text-sm">No entries yet. Be the first to join!</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className={cn(
                'hidden sm:grid gap-4 px-5 py-2.5 bg-white/[0.02] text-xs text-gray-500 font-medium uppercase tracking-wider',
                isLiveTrading ? 'grid-cols-[2.5rem_1fr_5rem_6rem_6rem]' : 'grid-cols-12'
              )}>
                <div className={isLiveTrading ? '' : 'col-span-1'}>#</div>
                <div className={isLiveTrading ? '' : 'col-span-5'}>Trader</div>
                {isLiveTrading && <div className="text-right">Live</div>}
                <div className={isLiveTrading ? 'text-right' : 'col-span-3 text-right'}>{isBestCall ? 'Best Trade' : 'PnL'}</div>
                <div className={isLiveTrading ? 'text-right' : 'col-span-3 text-right'}>{isBestCall ? 'Total PnL' : 'Best Trade'}</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry) => {
                  const isMe = entry.user_id === competition.my_entry?.user_id
                  const primaryValue = isBestCall ? entry.best_trade_return : entry.pnl_delta
                  const secondaryValue = isBestCall ? entry.pnl_delta : entry.best_trade_return

                  return (
                    <div
                      key={entry.entry_id}
                      className={cn(
                        'flex flex-col gap-1 px-4 sm:px-5 py-3',
                        isLiveTrading
                          ? 'sm:grid sm:grid-cols-[2.5rem_1fr_5rem_6rem_6rem] sm:gap-4 sm:items-center'
                          : 'sm:grid sm:grid-cols-12 sm:gap-4 sm:items-center',
                        isMe && 'bg-rose-500/5'
                      )}
                    >
                      {/* Mobile: Rank + User row */}
                      <div className="flex items-center gap-3 sm:contents">
                        {/* Rank */}
                        <div className={cn(!isLiveTrading && 'sm:col-span-1', 'flex-shrink-0')}>
                          {entry.rank <= 3 ? (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${
                              rankColors[entry.rank] || 'from-gray-500 to-gray-700'
                            } flex items-center justify-center`}>
                              <span className="text-white text-xs font-bold">{entry.rank}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 font-mono text-sm pl-1">{entry.rank}</span>
                          )}
                        </div>

                        {/* Trader */}
                        <div className={cn(!isLiveTrading && 'sm:col-span-5', 'flex-1 min-w-0')}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-medium text-xs">
                                {entry.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">
                                {entry.username}
                                {isMe && <span className="text-rose-400 ml-1">(You)</span>}
                              </p>
                              {entry.tier && (
                                <TierBadge tier={entry.tier as TierName} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Mobile PnL */}
                        <div className="sm:hidden ml-auto text-right">
                          <span className={cn(
                            'text-sm font-mono font-bold',
                            (primaryValue ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {isBestCall
                              ? formatPercent(primaryValue)
                              : formatPnl(primaryValue ?? 0)
                            }
                          </span>
                        </div>
                      </div>

                      {/* Desktop: Live minutes column (live_trading only) */}
                      {isLiveTrading && (
                        <div className="hidden sm:flex items-center justify-end gap-1">
                          <Radio className="w-3 h-3 text-purple-400" />
                          <span className={cn(
                            'font-mono text-sm',
                            (entry.live_minutes ?? 0) >= 30 ? 'text-purple-400' : 'text-gray-500'
                          )}>
                            {entry.live_minutes ?? 0}m
                          </span>
                        </div>
                      )}

                      {/* Desktop: PnL columns */}
                      <div className={cn('hidden sm:block text-right', !isLiveTrading && 'col-span-3')}>
                        <span className={cn(
                          'font-mono font-bold text-base',
                          (primaryValue ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isBestCall
                            ? formatPercent(primaryValue)
                            : formatPnl(primaryValue ?? 0)
                          }
                        </span>
                      </div>

                      <div className={cn('hidden sm:block text-right', !isLiveTrading && 'col-span-3')}>
                        <span className="text-gray-500 font-mono text-sm">
                          {isBestCall
                            ? formatPnl(secondaryValue ?? 0)
                            : formatPercent(secondaryValue)
                          }
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card className="!bg-white/[0.01]">
        <CardContent className="py-5 px-5">
          <h3 className="text-sm font-semibold text-white mb-3">Rules</h3>
          <ul className="space-y-1.5 text-gray-400 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">-</span>
              {isBestCall
                ? 'Ranked by your single highest % return trade during the competition window.'
                : isLiveTrading
                ? 'Ranked by total verified wallet PnL. You must be streaming live on Twitch for your PnL to count.'
                : 'Ranked by total verified wallet PnL from entry to competition end.'}
            </li>
            {isLiveTrading && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">-</span>
                  <span className="text-purple-300">You must connect your Twitch account in Settings to enter.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">-</span>
                  <span className="text-purple-300">Minimum 30 minutes of live streaming required to qualify for the leaderboard.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">-</span>
                  <span className="text-purple-300">Your live status is checked every 10 minutes via the Twitch API.</span>
                </li>
              </>
            )}
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">-</span>
              Your wallet must be verified. PnL is pulled from on-chain data.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">-</span>
              Minimum {competition.min_participants} participants required for prizes to be awarded.
            </li>
            {competition.tier_requirement && (
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-0.5">-</span>
                Requires {competition.tier_requirement} tier or higher to enter.
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">-</span>
              Top 3 earn GalaxyArena points + XP toward your prestige tier.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
