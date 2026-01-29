'use client'

import Link from 'next/link'
import { useRecentMatches } from '@/lib/hooks/use-matches'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Target,
  Loader2,
  Clock,
  Zap
} from 'lucide-react'

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

export default function AllMatchesPage() {
  const { matches, isLoading, mutate } = useRecentMatches(100) // Get more matches
  
  // Group matches by formula
  const matchesByFormula = matches.reduce((acc, match) => {
    const formulaName = match.formula?.name || 'Unknown Formula'
    if (!acc[formulaName]) {
      acc[formulaName] = []
    }
    acc[formulaName].push(match)
    return acc
  }, {} as Record<string, typeof matches>)
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent pb-1">
          All Matches
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          All tokens matched by your active formulas
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Matches</p>
              <p className="text-2xl font-bold text-white mt-1">{matches.length}</p>
            </div>
            <Target className="w-8 h-8 text-arena-cyan/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Wins</p>
              <p className="text-2xl font-bold text-arena-cyan mt-1">
                {matches.filter(m => m.is_win === true).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-arena-cyan/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {matches.filter(m => m.is_win === null).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400/50" />
          </CardContent>
        </Card>
      </div>
      
      {/* Matches list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No matches yet</h3>
            <p className="text-gray-400 mb-4">
              Your formulas haven't matched any tokens yet. Make sure you have active formulas scanning.
            </p>
            <Link href="/formulas/new">
              <Button>
                <Zap className="w-4 h-4 mr-2" />
                Create Formula
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <Card key={match.id} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-arena-purple/30 to-arena-cyan/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {match.token_symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{match.token_symbol}</h3>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400 text-sm">{match.token_name}</span>
                        {match.dexscreener_url && (
                          <a 
                            href={match.dexscreener_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-arena-cyan transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(match.matched_at)}
                        </span>
                        <Link 
                          href={`/formulas/${match.formula_id}`}
                          className="text-arena-purple hover:text-arena-cyan transition-colors"
                        >
                          {match.formula?.name || 'View Formula'}
                        </Link>
                        <span className="uppercase">{match.chain}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="text-right">
                    {match.is_win !== null && match.is_win !== undefined ? (
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                        match.is_win 
                          ? 'bg-arena-cyan/20 text-arena-cyan' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {match.is_win ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {match.is_win ? 'Win' : 'Loss'}
                      </div>
                    ) : (
                      <span className="text-yellow-400 text-sm px-3 py-1 bg-yellow-400/10 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Stats grid */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Price at Match</p>
                    <p className="text-white font-mono">${match.price_at_match?.toFixed(8) || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">1h Return</p>
                    <p className={`font-mono ${
                      match.return_1h !== null && match.return_1h !== undefined
                        ? match.return_1h >= 0 ? 'text-arena-cyan' : 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {match.return_1h !== null && match.return_1h !== undefined
                        ? `${match.return_1h >= 0 ? '+' : ''}${match.return_1h.toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">24h Return</p>
                    <p className={`font-mono ${
                      match.return_24h !== null && match.return_24h !== undefined
                        ? match.return_24h >= 0 ? 'text-arena-cyan' : 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {match.return_24h !== null && match.return_24h !== undefined
                        ? `${match.return_24h >= 0 ? '+' : ''}${match.return_24h.toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">7d Return</p>
                    <p className={`font-mono ${
                      match.return_7d !== null && match.return_7d !== undefined
                        ? match.return_7d >= 0 ? 'text-arena-cyan' : 'text-red-400'
                        : 'text-gray-500'
                    }`}>
                      {match.return_7d !== null && match.return_7d !== undefined
                        ? `${match.return_7d >= 0 ? '+' : ''}${match.return_7d.toFixed(1)}%`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Liquidity</p>
                    <p className="text-white font-mono">
                      ${match.liquidity?.toLocaleString() || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">24h Volume</p>
                    <p className="text-white font-mono">
                      ${match.volume_24h?.toLocaleString() || '—'}
                    </p>
                  </div>
                </div>
                
                {/* Token address */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Contract Address</p>
                  <code className="text-sm text-gray-400 break-all">{match.token_address}</code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
