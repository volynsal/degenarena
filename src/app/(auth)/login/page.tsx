'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, ArrowRight, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const supabase = createClient()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }
    
    router.push(redirect)
    router.refresh()
  }
  
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
  }
  
  return (
    <div className="min-h-screen bg-arena-darker flex flex-col">
      {/* Header */}
      <nav className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
          <span className="text-xl font-bold gradient-text">DegenArena HQ</span>
        </Link>
      </nav>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-arena-dark/50 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
              <p className="text-gray-400">Sign in to continue to DegenArena HQ</p>
            </div>
            
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-arena-dark/50 text-gray-500">or continue with email</span>
              </div>
            </div>
            
            {/* Email form */}
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
              
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-arena-purple focus:ring-arena-purple"
                  />
                  <span className="text-sm text-gray-400">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-arena-purple hover:text-arena-cyan transition-colors">
                  Forgot password?
                </Link>
              </div>
              
              <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
            
            {/* Waitlist link */}
            <p className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/#waitlist" className="text-arena-purple hover:text-arena-cyan transition-colors font-medium">
                Join the waitlist
              </Link>
            </p>
          </div>
          
          {/* Features preview */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-3">What you&apos;ll get access to:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Formula Builder',
                'Telegram Alerts',
                'Competitions',
                'Clan Battles',
                'Leaderboards',
                'Strategy Presets'
              ].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs border border-white/10"
                >
                  {feature}
                </span>
              ))}
            </div>
            
            {/* Coming Soon */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-arena-purple/20 to-arena-cyan/20 border border-arena-purple/30">
                <Zap className="w-4 h-4 text-arena-cyan" />
                <span className="text-sm">
                  <span className="text-gray-400">Coming Soon:</span>{' '}
                  <span className="font-medium bg-gradient-to-r from-arena-purple to-arena-cyan bg-clip-text text-transparent">
                    Sniper Agent
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
