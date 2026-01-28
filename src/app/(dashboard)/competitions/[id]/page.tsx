'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCompetition } from '@/lib/hooks/use-competitions'
import { useFormulas } from '@/lib/hooks/use-formulas'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Trophy, 
  Clock, 
  Users, 
  Zap,
  Swords,
  Calendar,
  ArrowLeft,
  Loader2,
  Timer,
  Shield,
  Target,
  TrendingUp,
  Medal,
  ChevronDown,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

const rankColors: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

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

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function CompetitionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const { 
    competition, 
    leaderboard, 
    isLoading, 
    isEntering, 
    error,
    enterCompetition,
    withdrawFromCompetition 
  } = useCompetition(id)
  
  const { formulas, isLoading: formulasLoading } = useFormulas()
  
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('')
  const [showFormulaDropdown, setShowFormulaDropdown] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  
  // Update countdown timer
  useEffect(() => {
    if (competition?.seconds_remaining) {
      setTimeRemaining(competition.seconds_remaining)
      
      const interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [competition?.seconds_remaining])
  
  // Set default formula
  useEffect(() => {
    if (formulas.length > 0 && !selectedFormulaId) {
      setSelectedFormulaId(formulas[0].id)
    }
  }, [formulas, selectedFormulaId])
  
  const handleEnter = async () => {
    if (!selectedFormulaId) return
    const success = await enterCompetition(selectedFormulaId)
    if (success) {
      setShowFormulaDropdown(false)
    }
  }
  
  const handleWithdraw = async () => {
    if (confirm('Are you sure you want to withdraw from this competition?')) {
      await withdrawFromCompetition()
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (!competition) {
    return (
      <div className="text-center py-20">
        <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium text-white mb-2">Competition not found</h3>
        <Link href="/competitions" className="text-arena-cyan hover:underline">
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
  const selectedFormula = formulas.find(f => f.id === selectedFormulaId)
  
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
        isLive && 'ring-2 ring-green-500/50'
      )}>
        <CardContent className="p-0">
          {/* Status bar */}
          <div className={cn(
            'h-1.5',
            isLive ? 'bg-green-500' : isUpcoming ? 'bg-yellow-500' : 'bg-gray-500'
          )} />
          
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Left: Competition info */}
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-4 rounded-xl border',
                    typeColors[competition.type]
                  )}>
                    <TypeIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
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
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      {competition.name}
                    </h1>
                    {competition.description && (
                      <p className="text-gray-400">{competition.description}</p>
                    )}
                  </div>
                </div>
                
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Users className="w-4 h-4" />
                      Participants
                    </div>
                    <p className="text-xl font-bold text-white">
                      {competition.participant_count}
                      {competition.max_participants && (
                        <span className="text-gray-500 text-sm font-normal">
                          /{competition.max_participants}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      {isUpcoming ? 'Starts' : 'Duration'}
                    </div>
                    <p className="text-xl font-bold text-white">
                      {isUpcoming 
                        ? formatDate(competition.starts_at).split(',')[0]
                        : competition.type === 'daily_flip' ? '24h' : '7d'
                      }
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Trophy className="w-4 h-4" />
                      1st Place
                    </div>
                    <p className="text-xl font-bold text-yellow-400">
                      {competition.prizes['1st']}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                      <Target className="w-4 h-4" />
                      Min. Entries
                    </div>
                    <p className="text-xl font-bold text-white">
                      {competition.min_participants}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right: Timer and CTA */}
              <div className="lg:w-80">
                {/* Countdown */}
                <div className={cn(
                  'rounded-xl p-4 mb-4 text-center',
                  isLive ? 'bg-green-500/10 border border-green-500/20' : 
                  isUpcoming ? 'bg-yellow-500/10 border border-yellow-500/20' :
                  'bg-gray-500/10 border border-gray-500/20'
                )}>
                  <p className={cn(
                    'text-sm font-medium mb-1',
                    isLive ? 'text-green-400' : isUpcoming ? 'text-yellow-400' : 'text-gray-400'
                  )}>
                    {isLive ? 'Time Remaining' : isUpcoming ? 'Starts In' : 'Competition Ended'}
                  </p>
                  <p className={cn(
                    'text-3xl font-mono font-bold',
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
                        <div className="bg-arena-cyan/10 border border-arena-cyan/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-arena-cyan mb-2">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">You're in!</span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Competing with: <span className="text-white">{(competition.my_entry as any)?.formula?.name || 'Your formula'}</span>
                          </p>
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
                        {/* Formula selector */}
                        <div className="relative">
                          <button
                            onClick={() => setShowFormulaDropdown(!showFormulaDropdown)}
                            className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg text-left hover:bg-white/10 transition-colors"
                          >
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">Select Formula</p>
                              <p className="text-white font-medium">
                                {selectedFormula?.name || 'Choose a formula...'}
                              </p>
                            </div>
                            <ChevronDown className={cn(
                              'w-5 h-5 text-gray-400 transition-transform',
                              showFormulaDropdown && 'rotate-180'
                            )} />
                          </button>
                          
                          {showFormulaDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-white/10 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                              {formulasLoading ? (
                                <div className="p-4 text-center text-gray-400">
                                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                </div>
                              ) : formulas.length === 0 ? (
                                <div className="p-4 text-center">
                                  <p className="text-gray-400 text-sm mb-2">No formulas yet</p>
                                  <Link href="/formulas/new" className="text-arena-cyan text-sm hover:underline">
                                    Create one
                                  </Link>
                                </div>
                              ) : (
                                formulas.map(formula => (
                                  <button
                                    key={formula.id}
                                    onClick={() => {
                                      setSelectedFormulaId(formula.id)
                                      setShowFormulaDropdown(false)
                                    }}
                                    className={cn(
                                      'w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors',
                                      selectedFormulaId === formula.id && 'bg-white/5'
                                    )}
                                  >
                                    <div className="text-left">
                                      <p className="text-white font-medium">{formula.name}</p>
                                      <p className="text-xs text-gray-400">
                                        {formula.win_rate}% win rate • {formula.total_matches} matches
                                      </p>
                                    </div>
                                    {selectedFormulaId === formula.id && (
                                      <Check className="w-4 h-4 text-arena-cyan" />
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          variant="primary" 
                          className="w-full"
                          onClick={handleEnter}
                          disabled={isEntering || !selectedFormulaId || isEnded}
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
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-400" />
              Leaderboard
            </h2>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No entries yet. Be the first to join!</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-white/5 text-sm text-gray-400 font-medium">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Trader / Formula</div>
                <div className="col-span-2 text-center">Matches</div>
                <div className="col-span-2 text-center">Wins</div>
                <div className="col-span-3 text-right">Total Return</div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y divide-white/5">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.entry_id}
                    className={cn(
                      'flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4 sm:items-center',
                      entry.user_id === competition.my_entry?.user_id && 'bg-arena-cyan/5'
                    )}
                  >
                    {/* Mobile: Rank + User row */}
                    <div className="flex items-center gap-3 sm:contents">
                      {/* Rank */}
                      <div className="sm:col-span-1 flex-shrink-0">
                        {entry.rank <= 3 ? (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                            rankColors[entry.rank] || 'from-gray-500 to-gray-700'
                          } flex items-center justify-center`}>
                            <span className="text-white text-sm font-bold">{entry.rank}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-sm">{entry.rank}</span>
                        )}
                      </div>
                      
                      {/* User & Formula */}
                      <div className="sm:col-span-4 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {entry.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {entry.username}
                              {entry.user_id === competition.my_entry?.user_id && (
                                <span className="text-arena-cyan ml-1">(You)</span>
                              )}
                            </p>
                            <p className="text-gray-500 text-xs truncate">{entry.formula_name}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mobile: Stats row */}
                    <div className="flex items-center gap-4 text-xs sm:hidden pl-11">
                      <span className="text-gray-400">{entry.total_matches} matches</span>
                      <span className="text-gray-400">{entry.wins} wins</span>
                      <span className={entry.total_return >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {entry.total_return >= 0 ? '+' : ''}{entry.total_return.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Desktop: Stats columns */}
                    <div className="hidden sm:flex col-span-2 items-center justify-center gap-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 font-mono">{entry.total_matches}</span>
                    </div>
                    
                    <div className="hidden sm:block col-span-2 text-center">
                      <span className="text-white font-mono">{entry.wins}</span>
                    </div>
                    
                    <div className="hidden sm:block col-span-3 text-right">
                      <span className={cn(
                        'font-mono font-bold text-lg',
                        entry.total_return >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {entry.total_return >= 0 ? '+' : ''}{entry.total_return.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Rules card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rules</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-arena-cyan">•</span>
              Your formula will be scanned for matching tokens during the competition period
            </li>
            <li className="flex items-start gap-2">
              <span className="text-arena-cyan">•</span>
              Total return is calculated from all matched tokens' 24h performance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-arena-cyan">•</span>
              {competition.formula_snapshot 
                ? 'Formula parameters are locked at entry time'
                : 'You can modify your formula during the competition'
              }
            </li>
            <li className="flex items-start gap-2">
              <span className="text-arena-cyan">•</span>
              Minimum {competition.min_participants} participants required for prizes to be awarded
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
