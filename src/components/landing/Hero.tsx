'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      setMessage(data.message || 'You\'re on the list!')
      setIsSubmitted(true)
      setEmail('')
    } catch (err) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/20 rounded-full blur-[128px]" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="text-sm text-gray-300">🏆 ESPORTS FOR DEGENS ⚔️ GET RANKED OR GET REKT</span>
        </div>
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">Build. Compete.</span>
          <br />
          <span className="gradient-text">Prove your alpha.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Create token-finding formulas. Enter weekly competitions and clan battles.
          Climb the global rankings. The best traders don&apos;t just make money—they prove it.
        </p>
        
        {/* Urgency */}
        <p className="text-sm text-arena-cyan/90 font-medium mb-6">
          Join the arena. Limited beta spots available.
        </p>
        
        {/* Email signup form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="flex flex-col items-center sm:flex-row sm:items-stretch gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 w-full sm:w-auto"
              required
            />
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              Join Waitlist
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 text-arena-cyan">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-lg">{message}</span>
          </div>
        )}
        
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
                      <span className="text-xs text-gray-400 uppercase tracking-wider">This Week&apos;s Leaders</span>
                      <span className="text-xs text-arena-purple">Live</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { rank: 1, name: 'SniperCopilot', tag: 'AI', wins: '89%', badge: '🤖' },
                        { rank: 2, name: 'degen_whale', tag: null, wins: '84%', badge: '🔥' },
                        { rank: 3, name: 'alpha_hunter', tag: null, wins: '78%', badge: '⚡' },
                        { rank: 4, name: 'memecoin_sage', tag: null, wins: '71%', badge: null },
                      ].map((trader) => (
                        <div key={trader.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 text-center font-bold ${trader.rank === 1 ? 'text-yellow-400' : trader.rank === 2 ? 'text-gray-300' : trader.rank === 3 ? 'text-orange-400' : 'text-gray-500'}`}>
                              #{trader.rank}
                            </span>
                            <span className="text-white font-medium">{trader.name}</span>
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
