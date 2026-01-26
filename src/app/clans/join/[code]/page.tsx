'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Shield, 
  Users, 
  Trophy,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface ClanInfo {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  member_count: number
  max_members: number
  avg_win_rate: number
  owner: {
    username: string
  }
}

export default function JoinClanPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [clan, setClan] = useState<ClanInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  useEffect(() => {
    fetchInvite()
  }, [params.code])
  
  const fetchInvite = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/clans/join/${params.code}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid invite')
      }
      
      setClan(data.data.clan)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/clans/join/${params.code}`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join')
      }
      
      setSuccess(true)
      
      // Redirect to clan page after short delay
      setTimeout(() => {
        router.push(`/clans/${data.data.slug}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-arena-darker flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" />
      
      <Card className="relative z-10 w-full max-w-md">
        <CardContent className="p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-arena-cyan animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Validating invite...</p>
            </div>
          ) : error && !clan ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Link href="/login">
                <Button variant="primary">Sign In</Button>
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-arena-cyan mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Welcome to the clan!</h2>
              <p className="text-gray-400">Redirecting...</p>
            </div>
          ) : clan ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-4">You've been invited to join</p>
                
                {/* Clan logo */}
                <div className="w-20 h-20 mx-auto rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-2xl font-bold text-white mb-4">
                  {clan.logo_url ? (
                    <img src={clan.logo_url} alt={clan.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    clan.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-white">{clan.name}</h1>
                <p className="text-sm text-gray-500">Created by @{clan.owner.username}</p>
              </div>
              
              {/* Description */}
              {clan.description && (
                <p className="text-gray-400 text-center mb-6">{clan.description}</p>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-lg font-bold text-white">{clan.member_count}/{clan.max_members}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-arena-cyan" />
                  <p className="text-lg font-bold text-white">{clan.avg_win_rate}%</p>
                  <p className="text-xs text-gray-500">Avg Win Rate</p>
                </div>
              </div>
              
              {/* Error message */}
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              
              {/* Join button */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleJoin}
                loading={isJoining}
              >
                <Shield className="w-4 h-4 mr-2" />
                Join Clan
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                This invite link is single-use and will expire after you join.
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
