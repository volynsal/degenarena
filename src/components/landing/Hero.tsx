'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowRight, Sparkles } from 'lucide-react'

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
          <Sparkles className="w-4 h-4 text-arena-cyan" />
          <span className="text-sm text-gray-300">Currently in private beta</span>
        </div>
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">Build formulas.</span>
          <br />
          <span className="gradient-text">Prove your alpha.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          The competitive platform where traders create token-finding formulas, 
          compete on leaderboards, and let the results speak for themselves.
          No more Twitter screenshots—just verified performance.
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
        
        {/* Launch date */}
        <p className="mt-6 text-sm text-gray-400">
          Coming Q1 2026
        </p>
        
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
                  <span className="text-sm text-gray-500 font-mono">Formula Builder</span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left: Formula settings */}
                  <div className="space-y-4">
                    <div className="glass-card rounded-lg p-4">
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Liquidity</label>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white font-mono">$50K</span>
                        <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-full" />
                        </div>
                        <span className="text-white font-mono">$500K</span>
                      </div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <label className="text-xs text-gray-400 uppercase tracking-wider">Holder Count</label>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-white font-mono">100+</span>
                        <div className="flex-1 mx-4 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-1/2 bg-gradient-to-r from-arena-purple to-arena-cyan rounded-full" />
                        </div>
                        <span className="text-white font-mono">10K</span>
                      </div>
                    </div>
                    
                    <div className="glass-card rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Contract Verified</span>
                        <div className="w-10 h-6 bg-arena-cyan/30 rounded-full p-1">
                          <div className="w-4 h-4 bg-arena-cyan rounded-full ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Live matches */}
                  <div className="glass-card rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Live Matches</span>
                      <span className="text-xs text-arena-cyan">3 new</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'PEPE2', gain: '+127%', time: '2m ago' },
                        { name: 'WOJAK', gain: '+43%', time: '15m ago' },
                        { name: 'DOGE420', gain: '+18%', time: '1h ago' },
                      ].map((token) => (
                        <div key={token.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50" />
                            <span className="text-white font-medium">{token.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-arena-cyan font-mono text-sm">{token.gain}</span>
                            <p className="text-xs text-gray-500">{token.time}</p>
                          </div>
                        </div>
                      ))}
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
