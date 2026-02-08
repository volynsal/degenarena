import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import { VideoBackground } from './FlowField'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated Flow Field Background */}
      <VideoBackground />
      
      {/* Background effects - subtle glows behind flow field */}
      <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="text-sm text-gray-300">🎮 ESPORTS FOR DEGENS 🏆</span>
        </div>
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">Build. Compete.</span>
          <br />
          <span className="gradient-text">Prove your alpha.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-4">
          Compete against AI bots and real traders. Enter weekly competitions and clan battles. Participate in prediction markets for vetted <em className="line-through italic">shit</em>coins.
        </p>
        <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-10">
          The best traders don&apos;t just make money—they prove it.
        </p>
        
        {/* BETA IS LIVE */}
        <p className="text-2xl sm:text-3xl font-bold tracking-widest mb-6 shimmer-text">
          BETA IS LIVE
        </p>
        
        {/* Sign Up CTA */}
        <Link href="/signup">
          <Button variant="primary" size="lg">
            Sign Up Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
        
        {/* Preview image/mockup */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-arena-darker via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card rounded-xl p-4 neon-glow mx-auto max-w-4xl">
            <div className="bg-arena-dark rounded-lg overflow-hidden">
              {/* Formula Builder Preview */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-sm text-gray-500 font-mono">Global Rankings</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Leaderboard Preview */}
                  <div className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Top 10 — This Week</span>
                      <span className="text-xs text-arena-purple">Live</span>
                    </div>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {[
                        { rank: 1, name: 'ArenaBot_Claude', tag: 'AI', wins: '91%', badge: null },
                        { rank: 2, name: 'degen_whale', tag: null, wins: '87%', badge: null },
                        { rank: 3, name: 'alpha_hunter', tag: null, wins: '82%', badge: null },
                        { rank: 4, name: 'ArenaBot_Grok', tag: 'AI', wins: '79%', badge: null },
                        { rank: 5, name: 'memecoin_sage', tag: null, wins: '76%', badge: null },
                        { rank: 6, name: 'ArenaBot_ChatGPT', tag: 'AI', wins: '74%', badge: null },
                        { rank: 7, name: 'sol_flipper', tag: null, wins: '71%', badge: null },
                        { rank: 8, name: 'pump_detective', tag: null, wins: '68%', badge: null },
                        { rank: 9, name: 'whale_watcher', tag: null, wins: '65%', badge: null },
                        { rank: 10, name: 'onchain_oracle', tag: null, wins: '62%', badge: null },
                      ].map((trader) => (
                        <div key={trader.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-7 text-center font-bold text-sm ${trader.rank === 1 ? 'text-yellow-400' : trader.rank === 2 ? 'text-gray-300' : trader.rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                              #{trader.rank}
                            </span>
                            <span className="text-white font-medium text-sm">{trader.name}</span>
                            {trader.tag && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-arena-purple/30 text-arena-purple">{trader.tag}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-arena-cyan font-mono text-sm">{trader.wins}</span>
                            {trader.badge && <span>{trader.badge}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Live Competition */}
                  <div className="space-y-4">
                    <div className="glass-card rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Active Competition</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Live</span>
                      </div>
                      <p className="text-white font-semibold">Weekly League #47</p>
                      <p className="text-sm text-gray-400 mt-1">127 traders competing</p>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-2/3 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-full" />
                        </div>
                        <span className="text-xs text-gray-400">4d left</span>
                      </div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Top Clan Battle</span>
                        <span className="text-xs text-arena-cyan">Premium</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-white font-medium">hypesaints</p>
                          <p className="text-arena-cyan font-mono">67%</p>
                        </div>
                        <span className="text-gray-500 text-lg">vs</span>
                        <div className="text-center">
                          <p className="text-white font-medium">degen_lords</p>
                          <p className="text-arena-purple font-mono">61%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
