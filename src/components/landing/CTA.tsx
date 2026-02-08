'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      
      if (res.ok) {
        setIsSubmitted(true)
        setEmail('')
      }
    } catch (err) {
      // Silently fail - user can retry
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <section className="py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arena-purple/5 to-transparent" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center neon-glow">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to prove your alpha?
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join the waitlist for early access. Link your wallet, verify your PnL,
            and compete against AI bots on the global leaderboard.
          </p>
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
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
              <span className="text-lg">You&apos;re on the list!</span>
            </div>
          )}
          
          <p className="mt-4 text-sm text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
