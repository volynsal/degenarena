'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCompetitions } from '@/lib/hooks/use-competitions'
import { Card, CardContent } from '@/components/ui/Card'
import { 
  Trophy, 
  Clock, 
  Users, 
  Zap,
  Swords,
  Calendar,
  ChevronRight,
  Loader2,
  Timer,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const statusFilters = [
  { value: 'active', label: 'Live & Upcoming' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
]

const typeIcons: Record<string, typeof Trophy> = {
  daily_flip: Zap,
  weekly: Calendar,
  head_to_head: Swords,
  clan_war: Shield,
}

const typeLabels: Record<string, string> = {
  daily_flip: '24-Hour Flip',
  weekly: 'Weekly',
  head_to_head: 'Head-to-Head',
  clan_war: 'Clan War',
}

const typeColors: Record<string, string> = {
  daily_flip: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  weekly: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  head_to_head: 'text-red-400 bg-red-400/10 border-red-400/20',
  clan_war: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
}

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
    minute: '2-digit'
  })
}

export default function CompetitionsPage() {
  const { competitions, isLoading, status, changeStatus } = useCompetitions()
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-red-400 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Competitions
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Battle other traders and prove your formula works</p>
        </div>
        
        {/* Status filter */}
        <div className="flex items-center bg-white/5 rounded-lg p-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => changeStatus(filter.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                status === filter.value
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : competitions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No competitions found</h3>
            <p className="text-gray-400">
              {status === 'completed' 
                ? 'No completed competitions yet' 
                : 'Check back soon for new competitions!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                      {/* Left: Status indicator */}
                      <div className={cn(
                        'sm:w-2 w-full h-2 sm:h-auto rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none',
                        isLive ? 'bg-green-500' : isUpcoming ? 'bg-yellow-500' : 'bg-gray-500'
                      )} />
                      
                      {/* Main content */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Icon and type badge */}
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'p-3 rounded-xl border',
                              typeColors[competition.type]
                            )}>
                              <TypeIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-white group-hover:text-arena-cyan transition-colors">
                                  {competition.name}
                                </h3>
                                {isLive && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    LIVE
                                  </span>
                                )}
                                {hasEntered && (
                                  <span className="px-2 py-0.5 rounded-full bg-arena-cyan/20 text-arena-cyan text-xs font-medium">
                                    Entered
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {typeLabels[competition.type]}
                              </p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-6 sm:ml-auto">
                            {/* Participants */}
                            <div className="flex items-center gap-2 text-gray-400">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">
                                {competition.participant_count}
                                {competition.max_participants && `/${competition.max_participants}`}
                              </span>
                            </div>
                            
                            {/* Time */}
                            <div className="flex items-center gap-2 text-gray-400">
                              {isLive ? (
                                <>
                                  <Timer className="w-4 h-4 text-green-400" />
                                  <span className="text-sm text-green-400">
                                    {formatTimeRemaining(competition.seconds_remaining || 0)} left
                                  </span>
                                </>
                              ) : isUpcoming ? (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-400">
                                    Starts {formatDate(competition.starts_at)}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" />
                                  <span className="text-sm">
                                    Ended {formatDate(competition.ends_at)}
                                  </span>
                                </>
                              )}
                            </div>
                            
                            {/* Prizes */}
                            <div className="hidden sm:flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm text-gray-400">
                                {competition.prizes['1st']}
                              </span>
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-arena-cyan transition-colors" />
                          </div>
                        </div>
                        
                        {/* Description */}
                        {competition.description && (
                          <p className="mt-3 text-sm text-gray-500 line-clamp-1">
                            {competition.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
      
      {/* Info section */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How Competitions Work</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-yellow-400/10 h-fit">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">24-Hour Flip</h4>
                <p className="text-sm text-gray-400">Quick battles. Best total return in 24 hours wins.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-blue-400/10 h-fit">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Weekly League</h4>
                <p className="text-sm text-gray-400">Consistency matters. Accumulate returns over 7 days.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-red-400/10 h-fit">
                <Swords className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Head-to-Head</h4>
                <p className="text-sm text-gray-400">Challenge rivals directly. Same token pool, best strategy wins.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
