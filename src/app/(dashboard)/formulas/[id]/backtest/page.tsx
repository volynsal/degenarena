'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useFormula } from '@/lib/hooks/use-formulas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Target,
  Trophy,
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BacktestResult {
  formulaId: string
  formulaName: string
  period: string
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  avgReturn: number
  bestMatch: {
    tokenSymbol: string
    return24h: number
    matchedAt: string
  } | null
  worstMatch: {
    tokenSymbol: string
    return24h: number
    matchedAt: string
  } | null
  matches: {
    tokenSymbol: string
    tokenName: string
    matchedAt: string
    priceAtMatch: number
    price24h: number | null
    return24h: number | null
    isWin: boolean | null
  }[]
}

const periods = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'all', label: 'All Time' },
]

export default function BacktestPage({ params }: { params: { id: string } }) {
  const { formula, isLoading: formulaLoading } = useFormula(params.id)
  const [period, setPeriod] = useState('30d')
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const runBacktest = async (selectedPeriod: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/formulas/${params.id}/backtest?period=${selectedPeriod}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run backtest')
      }
      
      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    runBacktest(period)
  }, [params.id, period])
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  if (formulaLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href={`/formulas/${params.id}`}>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Performance History</h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1">{formula?.name} — tracked since creation</p>
          </div>
        </div>
        
        {/* Period selector */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white/5 rounded-lg p-1 w-fit">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : result ? (
        <>
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    <Target className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Matches</p>
                    <p className="text-2xl font-bold text-white">{result.totalMatches}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-arena-cyan/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-arena-cyan" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Win Rate</p>
                    <p className="text-2xl font-bold text-white">{result.winRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    result.avgReturn >= 0 ? 'bg-arena-cyan/20' : 'bg-red-500/20'
                  }`}>
                    {result.avgReturn >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-arena-cyan" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Return</p>
                    <p className={`text-2xl font-bold ${
                      result.avgReturn >= 0 ? 'text-arena-cyan' : 'text-red-400'
                    }`}>
                      {result.avgReturn >= 0 ? '+' : ''}{result.avgReturn}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-arena-purple/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-arena-purple" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">W / L</p>
                    <p className="text-2xl font-bold text-white">
                      <span className="text-arena-cyan">{result.wins}</span>
                      {' / '}
                      <span className="text-red-400">{result.losses}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Best & Worst */}
          {(result.bestMatch || result.worstMatch) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {result.bestMatch && (
                <Card className="border-arena-cyan/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-arena-cyan" />
                      <span className="text-sm text-gray-400">Best Performer</span>
                    </div>
                    <p className="text-xl font-bold text-white">{result.bestMatch.tokenSymbol}</p>
                    <p className="text-2xl font-mono text-arena-cyan">
                      +{result.bestMatch.return24h.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(result.bestMatch.matchedAt)}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {result.worstMatch && (
                <Card className="border-red-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-gray-400">Worst Performer</span>
                    </div>
                    <p className="text-xl font-bold text-white">{result.worstMatch.tokenSymbol}</p>
                    <p className="text-2xl font-mono text-red-400">
                      {result.worstMatch.return24h.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(result.worstMatch.matchedAt)}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          {/* Matches Table */}
          {result.matches.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Match History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-sm text-gray-400 font-medium px-6 py-4">Token</th>
                        <th className="text-left text-sm text-gray-400 font-medium px-6 py-4">Date</th>
                        <th className="text-right text-sm text-gray-400 font-medium px-6 py-4">Entry Price</th>
                        <th className="text-right text-sm text-gray-400 font-medium px-6 py-4">24h Price</th>
                        <th className="text-right text-sm text-gray-400 font-medium px-6 py-4">Return</th>
                        <th className="text-center text-sm text-gray-400 font-medium px-6 py-4">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.matches.map((match, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{match.tokenSymbol}</p>
                              <p className="text-sm text-gray-500">{match.tokenName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {formatDate(match.matchedAt)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-300">
                            ${match.priceAtMatch.toFixed(8)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-gray-300">
                            {match.price24h ? `$${match.price24h.toFixed(8)}` : '—'}
                          </td>
                          <td className={`px-6 py-4 text-right font-mono ${
                            match.return24h !== null
                              ? match.return24h >= 0 ? 'text-arena-cyan' : 'text-red-400'
                              : 'text-gray-500'
                          }`}>
                            {match.return24h !== null 
                              ? `${match.return24h >= 0 ? '+' : ''}${match.return24h.toFixed(1)}%`
                              : '—'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {match.isWin !== null ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                match.isWin 
                                  ? 'bg-arena-cyan/20 text-arena-cyan' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {match.isWin ? 'WIN' : 'LOSS'}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium text-white mb-2">No completed matches</h3>
                <p className="text-gray-400">
                  This formula doesn't have any matches with 24h returns calculated yet.
                  Matches need 24 hours to complete for backtesting.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
