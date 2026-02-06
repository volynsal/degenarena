'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlowField } from '@/components/landing/FlowField'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, ArrowRight, Zap, Check, Trophy, Target, Bell, Users } from 'lucide-react'

const features = [
  { icon: Target, text: 'Which LLMs do you want to see in our arena? Compete against the ArenaBots' },
  { icon: Bell, text: 'AI copilot to advise you on alerts instantly in the same chat, powered by Grok' },
  { icon: Trophy, text: 'Take on the global leaderboard and contend in clan battles' },
  { icon: Users, text: 'Go live on your own or with your clan' },
]

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          referral_source: referralSource || undefined 
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setSuccess(true)
        setMessage(data.message || "You're on the list!")
      }
    } catch (err) {
      setError('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-arena-darker relative overflow-hidden">
      {/* Animated background */}
      <FlowField />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text font-brand">DegenArena HQ</span>
          </Link>
        </nav>
        
        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Left side - Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-arena-purple/20 border border-arena-purple/30 text-arena-purple text-sm mb-4">
                <Zap className="w-4 h-4" />
                Early Access Waitlist
              </div>
              
              <p className="text-sm sm:text-base font-bold tracking-[0.2em] text-arena-cyan uppercase mb-4">
                Esports for Degens
              </p>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Find the next
                <br />
                <span className="gradient-text">100x</span> before
                <br />
                everyone else
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0">
                Build custom formulas to scan thousands of new tokens. 
                Get instant alerts when your criteria match.
              </p>
              
              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-arena-cyan/10 border border-arena-cyan/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-arena-cyan" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right side - Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="bg-arena-dark/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
                {success ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">You&apos;re on the list!</h2>
                    <p className="text-gray-400 mb-6">
                      {message}
                    </p>
                    <div className="p-4 rounded-lg bg-arena-purple/10 border border-arena-purple/20">
                      <p className="text-sm text-gray-300">
                        We&apos;ll email <strong className="text-white">{email}</strong> when it&apos;s your turn to join.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        Join the waitlist
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Be first to access DegenArena HQ
                      </p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                          {error}
                        </div>
                      )}
                      
                      <Input
                        type="email"
                        label="Email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail className="w-5 h-5" />}
                        required
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          How did you hear about us? <span className="text-gray-500">(optional)</span>
                        </label>
                        <select
                          value={referralSource}
                          onChange={(e) => setReferralSource(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-arena-dark">Select...</option>
                          <option value="twitter" className="bg-arena-dark">Twitter/X</option>
                          <option value="telegram" className="bg-arena-dark">Telegram</option>
                          <option value="discord" className="bg-arena-dark">Discord</option>
                          <option value="friend" className="bg-arena-dark">Friend referral</option>
                          <option value="youtube" className="bg-arena-dark">YouTube</option>
                          <option value="tiktok" className="bg-arena-dark">TikTok</option>
                          <option value="other" className="bg-arena-dark">Other</option>
                        </select>
                      </div>
                      
                      <div className="pt-2">
                        <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        No spam, ever. We&apos;ll only email you when it&apos;s your turn.
                      </p>
                    </form>
                  </>
                )}
              </div>
              
              {/* Social proof */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  <span className="text-arena-cyan font-medium">Beta access</span> coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="p-4 sm:p-6 text-center">
          <p className="text-sm text-gray-500">
            Already have access?{' '}
            <Link href="/login" className="text-arena-purple hover:text-arena-cyan transition-colors">
              Sign in
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
