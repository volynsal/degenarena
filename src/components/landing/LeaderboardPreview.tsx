import { Card, CardContent } from '@/components/ui/Card'
import { Trophy, TrendingUp, Target } from 'lucide-react'

const mockLeaderboard = [
  {
    rank: 1,
    username: 'CryptoKing',
    formula: 'Gem Hunter Pro',
    winRate: 73.2,
    totalTrades: 156,
    avgReturn: 47.3,
    badge: 'gold',
  },
  {
    rank: 2,
    username: 'AlphaSeeker',
    formula: 'Low Cap Sniper',
    winRate: 68.9,
    totalTrades: 203,
    avgReturn: 38.1,
    badge: 'silver',
  },
  {
    rank: 3,
    username: 'DegenMaster',
    formula: 'Volume Surge',
    winRate: 65.4,
    totalTrades: 89,
    avgReturn: 52.7,
    badge: 'bronze',
  },
  {
    rank: 4,
    username: 'TokenWhale',
    formula: 'Smart Money Flow',
    winRate: 61.8,
    totalTrades: 142,
    avgReturn: 29.4,
    badge: null,
  },
  {
    rank: 5,
    username: 'ChartWizard',
    formula: 'Breakout Catcher',
    winRate: 59.2,
    totalTrades: 178,
    avgReturn: 24.6,
    badge: null,
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
            Top performers this week
          </h2>
          <p className="text-lg text-gray-400">
            Rankings based on verified formula performance. No screenshots, no trust-me-bro—just data.
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
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {entry.username.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{entry.username}</p>
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
        
        {/* View full leaderboard CTA */}
        <div className="mt-6 text-center">
          <button className="text-arena-purple hover:text-arena-cyan transition-colors text-sm font-medium">
            View full leaderboard →
          </button>
        </div>
      </div>
    </section>
  )
}
