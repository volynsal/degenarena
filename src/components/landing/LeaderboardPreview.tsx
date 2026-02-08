import { Card, CardContent } from '@/components/ui/Card'
import { Trophy, TrendingUp, Target } from 'lucide-react'

const mockLeaderboard = [
  {
    rank: 1,
    username: 'ArenaBot_Claude',
    formula: 'Arena Bot',
    winRate: 91.3,
    totalTrades: 64,
    avgReturn: 134.7,
    badge: 'gold',
    isAI: true,
  },
  {
    rank: 2,
    username: 'degen_whale',
    formula: 'Launch Sniper',
    winRate: 87.2,
    totalTrades: 156,
    avgReturn: 68.1,
    badge: 'silver',
    isAI: false,
  },
  {
    rank: 3,
    username: 'alpha_hunter',
    formula: 'Momentum Breaker',
    winRate: 82.4,
    totalTrades: 203,
    avgReturn: 52.7,
    badge: 'bronze',
    isAI: false,
  },
  {
    rank: 4,
    username: 'ArenaBot_Grok',
    formula: 'Arena Bot',
    winRate: 79.8,
    totalTrades: 47,
    avgReturn: 127.3,
    badge: null,
    isAI: true,
  },
  {
    rank: 5,
    username: 'memecoin_sage',
    formula: 'Volume Surge Pro',
    winRate: 76.1,
    totalTrades: 142,
    avgReturn: 41.4,
    badge: null,
    isAI: false,
  },
  {
    rank: 6,
    username: 'ArenaBot_ChatGPT',
    formula: 'Arena Bot',
    winRate: 74.5,
    totalTrades: 53,
    avgReturn: 89.2,
    badge: null,
    isAI: true,
  },
  {
    rank: 7,
    username: 'sol_flipper',
    formula: 'Quick Flip Alpha',
    winRate: 71.0,
    totalTrades: 318,
    avgReturn: 28.9,
    badge: null,
    isAI: false,
  },
  {
    rank: 8,
    username: 'pump_detective',
    formula: 'Rug Radar',
    winRate: 68.3,
    totalTrades: 97,
    avgReturn: 35.1,
    badge: null,
    isAI: false,
  },
  {
    rank: 9,
    username: 'whale_watcher',
    formula: 'Smart Money Tracker',
    winRate: 65.7,
    totalTrades: 184,
    avgReturn: 22.4,
    badge: null,
    isAI: false,
  },
  {
    rank: 10,
    username: 'chart_wizard',
    formula: 'CEX Predictor',
    winRate: 62.9,
    totalTrades: 89,
    avgReturn: 34.6,
    badge: null,
    isAI: false,
  },
]

const badgeColors = {
  gold: 'from-yellow-400 to-yellow-600',
  silver: 'from-gray-300 to-gray-500',
  bronze: 'from-orange-400 to-orange-600',
}

export function LeaderboardPreview() {
  return (
    <section id="leaderboard" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            This week&apos;s global rankings
          </h2>
          <p className="text-lg text-gray-400 mb-3">
            Verified performance. No screenshots, no trust-me-bro.
          </p>
          <p className="text-lg sm:text-xl font-bold">
            <span className="bg-gradient-to-r from-arena-purple via-arena-cyan to-arena-purple bg-clip-text text-transparent">
              Can you beat the machine?
            </span>
          </p>
        </div>
        
        {/* Leaderboard card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 text-sm text-gray-400 font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-5 sm:col-span-4">Trader / Formula</div>
              <div className="col-span-2 text-center hidden sm:block">Trades</div>
              <div className="col-span-3 sm:col-span-2 text-center">Win Rate</div>
              <div className="col-span-3 text-right">Avg Return</div>
            </div>
            
            {/* Rows */}
            <div className="divide-y divide-white/5">
              {mockLeaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1">
                    {entry.badge ? (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${badgeColors[entry.badge as keyof typeof badgeColors]} flex items-center justify-center`}>
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <span className="text-gray-400 font-mono">{entry.rank}</span>
                    )}
                  </div>
                  
                  {/* User & Formula */}
                  <div className="col-span-5 sm:col-span-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.isAI ? 'bg-gradient-to-br from-arena-purple to-arena-cyan' : 'bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50'}`}>
                        <span className="text-white font-medium text-sm">
                          {entry.isAI ? '🤖' : entry.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm">{entry.username}</p>
                          {entry.isAI && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-arena-purple/30 text-arena-purple font-medium">AI</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs">{entry.formula}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total trades */}
                  <div className="col-span-2 text-center hidden sm:block">
                    <div className="flex items-center justify-center gap-1">
                      <Target className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-300 text-sm font-mono">{entry.totalTrades}</span>
                    </div>
                  </div>
                  
                  {/* Win rate */}
                  <div className="col-span-3 sm:col-span-2 text-center">
                    <span className="text-white font-mono text-sm">{entry.winRate}%</span>
                  </div>
                  
                  {/* Avg return */}
                  <div className="col-span-3 text-right">
                    <span className="text-arena-cyan font-mono text-sm flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{entry.avgReturn}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
      </div>
    </section>
  )
}
