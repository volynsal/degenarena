'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FeatureGate } from '@/components/ui/FeatureGate'
import { useFeatureGate } from '@/lib/hooks/use-feature-gate'
import { 
  Users, 
  Trophy,
  Plus,
  Loader2,
  Shield,
  Target,
  Key,
  ArrowRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MyClan {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  member_count: number
  total_matches: number
  avg_win_rate: number
  role: string
}

export default function ClansPage() {
  const gateStatus = useFeatureGate('clans')
  const router = useRouter()
  const [myClan, setMyClan] = useState<MyClan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  
  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return
    
    setIsJoining(true)
    setJoinError(null)
    
    try {
      const res = await fetch(`/api/clans/join/${inviteCode.trim().toUpperCase()}`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid invite code')
      }
      
      // Redirect to the clan page
      router.push(`/clans/${data.data.slug}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  const fetchMyClan = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/clans/me')
      const data = await res.json()
      
      if (data.data) {
        setMyClan(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch clan:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMyClan()
  }, [])
  
  // Feature gate — check prediction wins + verified PnL
  if (!gateStatus.isUnlocked) {
    return <FeatureGate status={gateStatus} featureName="Clans" />
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  // User is in a clan
  if (myClan) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Clan
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage your trading team</p>
        </div>
        
        <Link href={`/clans/${myClan.slug}`} className="block mt-6">
          <Card hover className="w-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-xl sm:text-2xl font-bold text-white overflow-hidden">
                  {myClan.logo_url ? (
                    <img src={myClan.logo_url} alt={myClan.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    myClan.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-lg sm:text-xl font-bold text-white truncate">{myClan.name}</h2>
                    <span className="px-2 py-0.5 rounded bg-arena-purple/20 text-arena-purple text-xs capitalize flex-shrink-0">
                      {myClan.role}
                    </span>
                  </div>
                  
                  {myClan.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{myClan.description}</p>
                  )}
                  
                  {/* Stats - responsive grid */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-white font-medium">{myClan.member_count}</span>
                      <span className="text-gray-500">members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-arena-cyan" />
                      <span className="text-white font-medium">{myClan.avg_win_rate}%</span>
                      <span className="text-gray-500 hidden xs:inline">win rate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-white font-medium">{myClan.total_matches}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    )
  }
  
  // User is not in a clan
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Clans
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Join a trading team or create your own</p>
      </div>
      
      <Card className="max-w-2xl">
        <CardContent className="p-12 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-gray-600" />
          <h3 className="text-xl font-bold text-white mb-2">You're not in a clan yet</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Clans are invite-only trading teams. Create your own clan and invite your friends, or ask someone to share an invite link with you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/clans/create">
              <Button variant="primary" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create a Clan
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-4 rounded-lg bg-white/5 text-left max-w-sm mx-auto">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-arena-cyan mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-2">Have an invite code?</p>
                <form onSubmit={handleJoinWithCode} className="flex gap-2">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    maxLength={8}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono tracking-widest text-center placeholder:text-gray-500 placeholder:tracking-normal"
                  />
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    loading={isJoining}
                    disabled={!inviteCode.trim()}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
                {joinError && (
                  <p className="text-xs text-red-400 mt-2">{joinError}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
