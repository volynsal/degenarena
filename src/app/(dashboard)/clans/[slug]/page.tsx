'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ArrowLeft,
  Users, 
  Trophy,
  Target,
  Shield,
  Link as LinkIcon,
  LogOut,
  Loader2,
  Crown,
  Star,
  Copy,
  Check
} from 'lucide-react'

interface ClanMember {
  user_id: string
  username: string
  avatar_url: string | null
  role: string
  win_rate: number
  total_matches: number
}

interface ClanDetails {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  owner_id: string
  is_public: boolean
  member_count: number
  total_matches: number
  avg_win_rate: number
  created_at: string
  owner: {
    username: string
    avatar_url: string | null
  }
  members: ClanMember[]
  is_member: boolean
  user_role: string | null
}

export default function ClanPage({ params }: { params: { slug: string } }) {
  const [clan, setClan] = useState<ClanDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    fetchClan()
  }, [params.slug])
  
  const fetchClan = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/clans/${params.slug}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Clan not found')
      }
      
      setClan(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clan')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleJoin = async () => {
    setIsJoining(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/join`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this clan?')) return
    
    setIsJoining(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/join`, {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to leave')
      }
      
      fetchClan()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to leave clan')
    } finally {
      setIsJoining(false)
    }
  }
  
  const generateInvite = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/clans/${params.slug}/invites`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate invite')
      }
      
      setInviteLink(data.data.link)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (error || !clan) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h1 className="text-xl font-bold text-white mb-2">Clan Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This clan does not exist.'}</p>
            <Link href="/clans">
              <Button variant="primary">Browse Clans</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clans">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
      </div>
      
      {/* Clan Header Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-3xl font-bold text-white">
              {clan.logo_url ? (
                <img src={clan.logo_url} alt={clan.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                clan.name.charAt(0).toUpperCase()
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{clan.name}</h1>
                {!clan.is_public && (
                  <span className="px-2 py-1 rounded bg-arena-purple/20 text-arena-purple text-xs">
                    Private
                  </span>
                )}
              </div>
              
              {clan.description && (
                <p className="text-gray-400 mb-4">{clan.description}</p>
              )}
              
              <p className="text-sm text-gray-500">
                Created by <Link href={`/u/${clan.owner.username}`} className="text-arena-cyan hover:underline">@{clan.owner.username}</Link>
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              {clan.is_member && (
                <>
                  {inviteLink ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteLink}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono"
                      />
                      <Button variant="secondary" onClick={copyInviteLink}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={generateInvite} loading={isGenerating}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Generate Invite Link
                    </Button>
                  )}
                  {clan.user_role !== 'owner' && (
                    <Button variant="ghost" onClick={handleLeave} loading={isJoining}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Clan
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-3xl font-bold text-white">{clan.member_count}</p>
            <p className="text-sm text-gray-500">Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-arena-cyan" />
            <p className="text-3xl font-bold text-white">{clan.avg_win_rate}%</p>
            <p className="text-sm text-gray-500">Avg Win Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-3xl font-bold text-white">{clan.total_matches}</p>
            <p className="text-sm text-gray-500">Total Matches</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({clan.members.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {clan.members.map((member) => (
              <Link 
                key={member.user_id} 
                href={`/u/${member.username}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arena-purple/50 to-arena-cyan/50 flex items-center justify-center text-white font-medium">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      member.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">@{member.username}</span>
                      {member.role === 'owner' && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                      {member.role === 'admin' && (
                        <Star className="w-4 h-4 text-arena-purple" />
                      )}
                    </div>
                    <span className="text-sm text-gray-500 capitalize">{member.role}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-white font-medium">{member.win_rate}%</p>
                    <p className="text-gray-500">Win Rate</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{member.total_matches}</p>
                    <p className="text-gray-500">Matches</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
