'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCompetitions, useUserXp } from '@/lib/hooks/use-competitions'
import { Card, CardContent } from '@/components/ui/Card'
import {
  Trophy,
  Clock,
  Users,
  Zap,
  Swords,
  ChevronRight,
  Loader2,
  Timer,
  Shield,
  Target,
  Radio,
  Crown,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompetitionTab, CompetitionType, TierName } from '@/types/database'
import { TIER_COLORS, TIER_LABELS } from '@/types/database'

// =============================================
// CONFIG
// =============================================

const TABS: { key: CompetitionTab | 'all'; label: string; icon: typeof Trophy }[] = [
  { key: 'live_trading', label: 'Live Trading', icon: Radio },
  { key: 'pnl_challenges', label: 'PnL Challenges', icon: TrendingUp },
  { key: 'clan_wars', label: 'Clan Wars', icon: Shield },
]

const STATUS_FILTERS = [
  { value: 'active', label: 'Live & Upcoming' },
  { value: 'completed', label: 'Completed' },
]

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

// =============================================
// HELPERS
// =============================================

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Ended'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TierBadge({ tier, size = 'sm' }: { tier: TierName; size?: 'sm' | 'md' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded border font-medium',
      TIER_COLORS[tier],
      size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
    )}>
      {TIER_LABELS[tier]}
    </span>
  )
}

// =============================================
// MAIN PAGE
// =============================================

export default function CompetitionsPage() {
  const [activeTab, setActiveTab] = useState<CompetitionTab | 'all'>('pnl_challenges')
  const { competitions, isLoading, status, changeStatus, changeTab } = useCompetitions()
  const { xp, progress } = useUserXp()

  const handleTabChange = (tab: CompetitionTab | 'all') => {
    setActiveTab(tab)
    changeTab(tab)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-red-400 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Competitions
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Compete with verified PnL. Prove you're the real deal.
          </p>
        </div>

        {/* Tier + XP badge */}
        {xp && progress && (
          <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-2.5">
            <div>
              <TierBadge tier={xp.tier as TierName} size="md" />
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {progress.xp_current} XP
                {progress.next_tier && ` / ${progress.xp_for_next}`}
              </p>
              <div className="w-24 h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === t.key
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => changeStatus(filter.value)}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              status === filter.value
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Competition list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
        </div>
      ) : competitions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No competitions yet</h3>
            <p className="text-gray-400 text-sm">
              {status === 'completed'
                ? 'No completed competitions.'
                : 'Competitions are created daily. Check back soon.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {competitions.map((competition) => {
            const TypeIcon = typeIcons[competition.type] || Trophy
            const isLive = competition.live_status === 'live'
            const isUpcoming = competition.live_status === 'upcoming'
            const hasEntered = !!competition.my_entry

            return (
              <Link key={competition.id} href={`/competitions/${competition.id}`}>
                <Card hover className="group">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Status indicator bar */}
                      <div className={cn(
                        'sm:w-1.5 w-full h-1.5 sm:h-auto rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none',
                        isLive ? 'bg-green-500' : isUpcoming ? 'bg-yellow-500' : 'bg-gray-600'
                      )} />

                      {/* Main content */}
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Left: icon + info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                              'p-2.5 rounded-xl border flex-shrink-0',
                              typeColors[competition.type]
                            )}>
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-white group-hover:text-rose-400 transition-colors truncate">
                                  {competition.name}
                                </h3>
                                {isLive && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Live
                                  </span>
                                )}
                                {hasEntered && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold uppercase">
                                    Entered
                                  </span>
                                )}
                                {competition.tier_requirement && (
                                  <TierBadge tier={competition.tier_requirement as TierName} />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {typeLabels[competition.type]}
                                {competition.description && ` — ${competition.description}`}
                              </p>
                            </div>
                          </div>

                          {/* Right: stats */}
                          <div className="flex items-center gap-4 sm:gap-6 sm:ml-auto flex-shrink-0 mt-2 sm:mt-0 pl-12 sm:pl-0">
                            {/* Participants */}
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-mono">
                                {competition.participant_count}
                                {competition.max_participants ? `/${competition.max_participants}` : ''}
                              </span>
                            </div>

                            {/* Time */}
                            <div className="flex items-center gap-1.5">
                              {isLive ? (
                                <>
                                  <Timer className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">
                                    {formatTimeRemaining(competition.seconds_remaining || 0)}
                                  </span>
                                </>
                              ) : isUpcoming ? (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">
                                    {formatDate(competition.starts_at)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs text-gray-500">
                                    Ended {formatDate(competition.ends_at)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Prize */}
                            {competition.point_prizes && (
                              <div className="hidden sm:flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs text-gray-400 font-mono">
                                  {competition.point_prizes['1st']} pts
                                </span>
                              </div>
                            )}

                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-rose-400 transition-colors" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
