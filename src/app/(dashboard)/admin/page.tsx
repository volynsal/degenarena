'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Search, RotateCcw, Loader2 } from 'lucide-react'

interface MarketResult {
  id: string
  question: string
  status: string
  outcome: string | null
  token_symbol: string
  price_at_creation: string
  price_at_resolution: string | null
  resolve_at: string
  resolved_at: string | null
  total_pool: number
  total_bettors: number
  market_data: any
}

interface BetResult {
  id: string
  user_id: string
  position: string
  amount: number
  payout: number | null
  is_winner: boolean | null
  username?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Market lookup
  const [searchQuery, setSearchQuery] = useState('')
  const [markets, setMarkets] = useState<MarketResult[]>([])
  const [selectedMarket, setSelectedMarket] = useState<MarketResult | null>(null)
  const [marketBets, setMarketBets] = useState<BetResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Fix market
  const [fixOutcome, setFixOutcome] = useState<'yes' | 'no'>('no')
  const [fixing, setFixing] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)
  const [fixError, setFixError] = useState('')

  // Check admin access
  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(data => {
        if (!data.is_admin) {
          router.replace('/dashboard')
        } else {
          setIsAdmin(true)
        }
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false))
  }, [router])

  // Search markets
  const searchMarkets = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSelectedMarket(null)
    setMarketBets([])
    setFixResult(null)
    setFixError('')

    try {
      const res = await fetch(`/api/admin/markets?q=${encodeURIComponent(searchQuery.trim())}`)
      const data = await res.json()
      if (data.markets) setMarkets(data.markets)
    } catch {
      console.error('Search failed')
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery])

  // Load bets for selected market
  const selectMarket = async (market: MarketResult) => {
    setSelectedMarket(market)
    setFixResult(null)
    setFixError('')
    setFixOutcome(market.outcome === 'yes' ? 'no' : 'yes')

    try {
      const res = await fetch(`/api/admin/markets/${market.id}/bets`)
      const data = await res.json()
      if (data.bets) setMarketBets(data.bets)
    } catch {
      console.error('Failed to load bets')
    }
  }

  // Fix market
  const handleFix = async () => {
    if (!selectedMarket) return
    setFixing(true)
    setFixError('')
    setFixResult(null)

    try {
      const res = await fetch('/api/arena-bets/fix-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market_id: selectedMarket.id,
          correct_outcome: fixOutcome,
        }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setFixError(data.error || 'Fix failed')
      } else {
        setFixResult(data)
        // Refresh the market data
        setSelectedMarket({ ...selectedMarket, outcome: fixOutcome })
      }
    } catch (err) {
      setFixError('Network error — please try again')
    } finally {
      setFixing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-rose-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500">Manage markets, fix resolutions, and moderate the platform</p>
        </div>
      </div>

      {/* Market Search */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Fix Market Resolution</h2>
          <p className="text-sm text-gray-400 mb-4">
            Search for a market by token symbol or question text, then fix the outcome if it was resolved incorrectly.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by token symbol or question (e.g. PATRIOTS, SEAHAWKS)"
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMarkets()}
              />
            </div>
            <Button
              onClick={searchMarkets}
              disabled={searchLoading || !searchQuery.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Search results */}
          {markets.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {markets.length} market{markets.length !== 1 ? 's' : ''} found
              </p>
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectMarket(m)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedMarket?.id === m.id
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-medium">{m.question}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      m.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      m.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>${m.token_symbol}</span>
                    <span>·</span>
                    <span>Pool: {m.total_pool} pts</span>
                    <span>·</span>
                    <span>{m.total_bettors} bettor{m.total_bettors !== 1 ? 's' : ''}</span>
                    {m.outcome && (
                      <>
                        <span>·</span>
                        <span className={m.outcome === 'yes' ? 'text-green-400' : 'text-red-400'}>
                          Outcome: {m.outcome.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Market Detail */}
      {selectedMarket && (
        <Card className="bg-white/[0.02] border-white/5">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">{selectedMarket.question}</h3>

            {/* Market info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <InfoBox label="Token" value={`$${selectedMarket.token_symbol}`} />
              <InfoBox label="Status" value={selectedMarket.status} />
              <InfoBox label="Current Outcome" value={selectedMarket.outcome?.toUpperCase() || 'N/A'} />
              <InfoBox label="Pool" value={`${selectedMarket.total_pool} pts`} />
              <InfoBox label="Price at Creation" value={`$${parseFloat(selectedMarket.price_at_creation || '0').toFixed(8)}`} />
              <InfoBox label="Price at Resolution" value={selectedMarket.price_at_resolution ? `$${parseFloat(selectedMarket.price_at_resolution).toFixed(8)}` : 'N/A'} />
              <InfoBox label="Resolve At" value={new Date(selectedMarket.resolve_at).toLocaleString()} />
              <InfoBox label="Resolved At" value={selectedMarket.resolved_at ? new Date(selectedMarket.resolved_at).toLocaleString() : 'N/A'} />
            </div>

            {/* Resolution log if available */}
            {selectedMarket.market_data?.resolution_log && (
              <div className="bg-white/[0.03] rounded-lg p-3 mb-4 border border-white/5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Resolution Log</p>
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                  {JSON.stringify(selectedMarket.market_data.resolution_log, null, 2)}
                </pre>
              </div>
            )}

            {/* Fix history if available */}
            {selectedMarket.market_data?.fix_applied && (
              <div className="bg-yellow-500/10 rounded-lg p-3 mb-4 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <p className="text-xs text-yellow-400 font-medium">Previously Fixed</p>
                </div>
                <p className="text-xs text-gray-400">
                  Original: {selectedMarket.market_data.original_outcome?.toUpperCase()} → 
                  Corrected: {selectedMarket.market_data.corrected_outcome?.toUpperCase()} 
                  on {new Date(selectedMarket.market_data.fix_timestamp).toLocaleString()}
                </p>
              </div>
            )}

            {/* Bets table */}
            {marketBets.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Bets ({marketBets.length})
                </p>
                <div className="bg-white/[0.02] rounded-lg border border-white/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-white/5">
                        <th className="text-left p-2.5">User</th>
                        <th className="text-left p-2.5">Position</th>
                        <th className="text-right p-2.5">Amount</th>
                        <th className="text-right p-2.5">Payout</th>
                        <th className="text-center p-2.5">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketBets.map((bet) => (
                        <tr key={bet.id} className="border-b border-white/5 last:border-0">
                          <td className="p-2.5 text-gray-300 font-mono text-xs">
                            {bet.username || bet.user_id.slice(0, 8) + '...'}
                          </td>
                          <td className="p-2.5">
                            <span className={`font-bold ${bet.position === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
                              {bet.position.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-2.5 text-right text-white">{bet.amount}</td>
                          <td className="p-2.5 text-right text-white">{bet.payout ?? '—'}</td>
                          <td className="p-2.5 text-center">
                            {bet.is_winner === true && <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />}
                            {bet.is_winner === false && <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                            {bet.is_winner === null && <span className="text-xs text-gray-500">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fix controls */}
            {selectedMarket.status === 'resolved' && (
              <div className="bg-rose-500/5 rounded-lg p-4 border border-rose-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <p className="text-sm font-semibold text-rose-400">Fix This Market</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  This will reverse all existing payouts and re-distribute with the correct outcome.
                  Win/loss counts and balances will be corrected.
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Correct outcome:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFixOutcome('yes')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        fixOutcome === 'yes'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      onClick={() => setFixOutcome('no')}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                        fixOutcome === 'no'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                  <Button
                    onClick={handleFix}
                    disabled={fixing || fixOutcome === selectedMarket.outcome}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-6 ml-auto"
                  >
                    {fixing ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Fixing...</>
                    ) : (
                      'Apply Fix'
                    )}
                  </Button>
                </div>
                {fixOutcome === selectedMarket.outcome && (
                  <p className="text-xs text-yellow-400 mt-2">
                    Outcome is already &quot;{selectedMarket.outcome}&quot;. Select the opposite to fix.
                  </p>
                )}
              </div>
            )}

            {/* Fix result */}
            {fixResult && (
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-semibold text-green-400">Market Fixed Successfully</p>
                </div>
                <p className="text-xs text-gray-400">
                  Outcome flipped from {fixResult.old_outcome?.toUpperCase()} → {fixResult.new_outcome?.toUpperCase()}.
                  {fixResult.new_payouts?.length} payouts re-distributed.
                </p>
              </div>
            )}

            {/* Fix error */}
            {fixError && (
              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20 mt-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm text-red-400">{fixError}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-white font-medium mt-0.5 truncate">{value}</p>
    </div>
  )
}
