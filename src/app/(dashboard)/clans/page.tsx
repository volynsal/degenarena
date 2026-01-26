'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Users, 
  Trophy,
  Plus,
  Loader2,
  Shield,
  Target,
  Link as LinkIcon
} from 'lucide-react'

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
  const [myClan, setMyClan] = useState<MyClan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
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
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Your Clan</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">Manage your trading team</p>
        </div>
        
        <Link href={`/clans/${myClan.slug}`}>
          <Card hover className="max-w-2xl">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-2xl font-bold text-white">
                  {myClan.logo_url ? (
                    <img src={myClan.logo_url} alt={myClan.name} className="w-full h-full rounded-xl object-cover" />
                  ) : (
                    myClan.name.charAt(0).toUpperCase()
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-white">{myClan.name}</h2>
                    <span className="px-2 py-0.5 rounded bg-arena-purple/20 text-arena-purple text-xs capitalize">
                      {myClan.role}
                    </span>
                  </div>
                  
                  {myClan.description && (
                    <p className="text-gray-400 mb-4">{myClan.description}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{myClan.member_count}</span>
                      <span className="text-gray-500">members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-arena-cyan" />
                      <span className="text-white font-medium">{myClan.avg_win_rate}%</span>
                      <span className="text-gray-500">win rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{myClan.total_matches}</span>
                      <span className="text-gray-500">matches</span>
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
        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Clans</h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">Join a trading team or create your own</p>
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
              <LinkIcon className="w-5 h-5 text-arena-cyan mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Have an invite link?</p>
                <p className="text-xs text-gray-400 mt-1">
                  Paste it in your browser to join a clan directly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
