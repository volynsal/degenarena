'use client'

import { useState } from 'react'
import { useLeaderboard, type Timeframe } from '@/lib/hooks/use-leaderboard'
import { useFormulas } from '@/lib/hooks/use-formulas'
import { Card, CardContent } from '@/components/ui/Card'
import { Trophy, TrendingUp, Target, Copy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const timeframes: Timeframe[] = ['24h', '7d', '30d', 'all']
const timeframeLabels: Record<Timeframe, string> = {
  '24h': '24h',
  '7d': '7d',
  '30d': '30d',
  'all': 'All Time',
}

const badgeColors: Record<number, string> = {
  1: 'from-yellow-400 to-yellow-600',
  2: 'from-gray-300 to-gray-500',
  3: 'from-orange-400 to-orange-600',
}

export default function LeaderboardPage() {
  const { entries, isLoading, timeframe, changeTimeframe } = useLeaderboard('7d')
  const { copyFormula } = useFormulas()
  const [copyingId, setCopyingId] = useState<string | null>(null)
  
  const handleCopy = async (formulaId: string) => {
    setCopyingId(formulaId)
    const result = await copyFormula(formulaId)
    setCopyingId(null)
    if (result) {
      alert('Formula copied! Check your formulas page.')
    }
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-arena-cyan via-arena-cyan via-[70%] to-arena-purple bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Top performing formulas ranked by win rate</p>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex items-center bg-white/5 rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => changeTimeframe(tf)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                timeframe === tf
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {timeframeLabels[tf]}
            </button>
          ))}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-medium text-white mb-2">No entries yet</h3>
          <p className="text-gray-400">Be the first to make your formula public and hit the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div className="grid md:grid-cols-3 gap-4">
              {[1, 0, 2].map((positionIndex, displayIndex) => {
                const entry = entries[positionIndex]
                if (!entry) return null
                const actualRank = positionIndex + 1
                
                return (
                  <Card 
                    key={entry.formula_id} 
                    className={cn(
                      'relative overflow-hidden',
                      actualRank === 1 && 'md:-mt-4 md:mb-4'
                    )}
                    glow={actualRank === 1}
                  >
                    <CardContent className="p-6 text-center">
                      {/* Rank badge */}
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                        badgeColors[actualRank] || 'from-gray-500 to-gray-700'
                      } flex items-center justify-center`}>
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      
                      {/* Rank number */}
                      <div className="text-4xl font-bold text-white mb-2">#{actualRank}</div>
                      
                      {/* User info */}
                      <div className="mb-4">
                        <p className="text-lg font-semibold text-white">{entry.username}</p>
                        <p className="text-sm text-arena-purple">{entry.formula_name}</p>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-2xl font-bold text-white">{entry.win_rate}%</p>
                          <p className="text-xs text-gray-500">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{entry.total_matches}</p>
                          <p className="text-xs text-gray-500">Matches</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-arena-cyan">
                            {entry.avg_return >= 0 ? '+' : ''}{entry.avg_return}%
                          </p>
                          <p className="text-xs text-gray-500">Avg Return</p>
                        </div>
                      </div>
                      
                      {/* Copy button */}
                      {entry.is_public && (
                        <button 
                          onClick={() => handleCopy(entry.formula_id)}
                          disabled={copyingId === entry.formula_id}
                          className="mt-4 w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                          {copyingId === entry.formula_id ? 'Copying...' : 'Copy Formula'}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
      
          {/* Full leaderboard table */}
          <Card>
            <CardContent className="p-0">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-sm text-gray-400 font-medium">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Trader / Formula</div>
                <div className="col-span-2 text-center hidden sm:block">Matches</div>
                <div className="col-span-2 text-center">Win Rate</div>
                <div className="col-span-2 text-right">Avg Return</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y divide-white/5">
                {entries.map((entry) => (
                  <div
                    key={entry.formula_id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      {entry.rank <= 3 ? (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                          badgeColors[entry.rank] || 'from-gray-500 to-gray-700'
                        } flex items-center justify-center`}>
                          <span className="text-white text-sm font-bold">{entry.rank}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono">{entry.rank}</span>
                      )}
                    </div>
                    
                    {/* User & Formula */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{entry.username}</p>
                          <p className="text-gray-500 text-sm truncate">{entry.formula_name}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Total trades */}
                    <div className="col-span-2 text-center hidden sm:flex items-center justify-center gap-1">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 font-mono">{entry.total_matches}</span>
                    </div>
                    
                    {/* Win rate */}
                    <div className="col-span-2 text-center">
                      <span className="text-white font-mono">{entry.win_rate}%</span>
                    </div>
                    
                    {/* Avg return */}
                    <div className="col-span-2 text-right">
                      <span className={`font-mono flex items-center justify-end gap-1 ${
                        entry.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        {entry.avg_return >= 0 ? '+' : ''}{entry.avg_return}%
                      </span>
                    </div>
                    
                    {/* Actions */}
                    <div className="col-span-1 text-right">
                      {entry.is_public ? (
                        <button 
                          onClick={() => handleCopy(entry.formula_id)}
                          disabled={copyingId === entry.formula_id}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">Private</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
