'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, User, ArrowRight, Zap, Check, ExternalLink } from 'lucide-react'
import { FlowField } from '@/components/landing/FlowField'

function useIsInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false)
  useEffect(() => {
    const ua = navigator.userAgent || ''
    // Detect common in-app browsers that break OAuth
    const inAppPatterns = /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|BytedanceWebview|Musical_ly/i
    setIsInApp(inAppPatterns.test(ua))
  }, [])
  return isInApp
}

const features = [
  'Compete against AI bots and real traders',
  'Real-time alerts via Telegram & Discord',
  'Track verified performance with analytics',
  'Prediction markets, token scanners, and more',
]

export default function SignupPage() {
  const router = useRouter()
  const isInAppBrowser = useIsInAppBrowser()
  
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setIsLoading(false)
      return
    }
    
    const supabase = createClient()
    
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }
    
    setSuccess(true)
    setIsLoading(false)
  }
  
  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // Build redirect URL robustly — in-app browsers (Instagram, TikTok, etc.)
      // can have issues with window.location.origin on first load
      const origin = window.location.origin || `${window.location.protocol}//${window.location.host}`
      
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          skipBrowserRedirect: false,
        },
      })
      
      if (oauthError) {
        setError(oauthError.message)
        setIsLoading(false)
      }
      // If successful, the browser redirects — isLoading stays true
    } catch (err) {
      setError('Failed to connect to Google. Please try again.')
      setIsLoading(false)
    }
  }
  
  if (success) {
    return (
      <div className="min-h-screen bg-arena-darker flex flex-col relative">
        <FlowField />
        <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
        <nav className="p-4 relative z-10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text font-brand">DegenArena HQ</span>
          </Link>
        </nav>
        
        <div className="flex-1 flex items-start sm:items-center justify-center p-4 relative z-10 overflow-y-auto">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-gray-400 mb-6">
              We&apos;ve sent a confirmation link to <strong className="text-white">{email}</strong>. 
              Click the link to activate your account.
            </p>
            <Link href="/login">
              <Button variant="secondary">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-arena-darker flex flex-col lg:flex-row relative">
      {/* Animated background */}
      <FlowField />
      <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col relative z-10">
        <nav className="p-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text font-brand">DegenArena HQ</span>
          </Link>
        </nav>
        
        <div className="flex-1 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-cyan/10 border border-arena-cyan/20 text-arena-cyan text-xs mb-4">
                <Zap className="w-3 h-3" />
                Early Access
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
              <p className="text-gray-400">Welcome to DegenArena HQ. Let&apos;s get you set up.</p>
            </div>
            
            {/* In-app browser warning */}
            {isInAppBrowser && (
              <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs">
                <p className="font-medium mb-1">Open in your browser for best experience</p>
                <p className="text-yellow-400/70">
                  In-app browsers (Instagram, TikTok, etc.) can cause issues with Google sign-in.
                  Tap <ExternalLink className="w-3 h-3 inline" /> or &quot;Open in Safari/Chrome&quot; in the menu.
                </p>
              </div>
            )}
            
            {/* Google Sign Up */}
            <button
              onClick={handleGoogleSignUp}
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
                <span className="px-4 bg-arena-darker text-gray-500">or continue with email</span>
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
                type="text"
                label="Username"
                placeholder="cryptoking"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                icon={<User className="w-5 h-5" />}
                required
              />
              
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
              <p className="text-xs text-gray-500 -mt-2">Minimum 8 characters</p>
              
              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-arena-purple hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-arena-purple hover:underline">Privacy Policy</Link>
              </p>
            </form>
            
            {/* Sign in link */}
            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="text-arena-purple hover:text-arena-cyan transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Right side - Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-arena-purple/20 to-arena-cyan/20 items-center justify-center p-12 relative z-10">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-white mb-6">
            Find and stream your 100x gainer as it happens
          </h2>
          <p className="text-gray-300 mb-8">
            Compete on a verified leaderboard against AI bots and real traders. Get instant alerts, track your performance, and climb the global rankings.
          </p>
          
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-arena-cyan/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-arena-cyan" />
                </div>
                <span className="text-gray-200">{feature}</span>
              </div>
            ))}
          </div>
          
          {/* Early access note */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400">
              You&apos;re getting <span className="text-arena-cyan font-medium">early access</span> to DegenArena HQ. 
              This link was shared with approved waitlist members.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
