'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  User,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Twitter,
  Copy,
  Loader2,
  UserPlus,
  UserMinus,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormulas } from '@/lib/hooks/use-formulas'
import { useAuthStore } from '@/lib/stores/auth-store'

interface PublicProfile {
  id: string
  username: string
  bio: string | null
  avatar_url: string | null
  twitter_handle: string | null
  follower_count: number
  following_count: number
  created_at: string
  clan: {
    id: string
    name: string
    slug: string
  } | null
  stats: {
    total_formulas: number
    total_matches: number
    avg_win_rate: number
    leaderboard_rank: number | null
  }
  is_following: boolean
}

interface Formula {
  id: string
  name: string
  description: string | null
  win_rate: number
  total_matches: number
  avg_return: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  rarity: string
  earned_at: string
}

const rarityColors: Record<string, string> = {
  common: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
  uncommon: 'bg-green-500/20 border-green-500/30 text-green-400',
  rare: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
  epic: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
  legendary: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const { copyFormula } = useFormulas()
  const { user } = useAuthStore()
  
  useEffect(() => {
    fetchProfile()
  }, [params.username])
  
  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch profile
      const profileRes = await fetch(`/api/profiles/${params.username}`)
      const profileData = await profileRes.json()
      
      if (!profileRes.ok) {
        throw new Error(profileData.error || 'User not found')
      }
      
      setProfile(profileData.data)
      setIsFollowing(profileData.data.is_following)
      
      // Fetch formulas
      const formulasRes = await fetch(`/api/profiles/${params.username}/formulas`)
      const formulasData = await formulasRes.json()
      
      if (formulasData.data) {
        setFormulas(formulasData.data)
      }
      
      // Fetch badges
      const badgesRes = await fetch(`/api/profiles/${params.username}/badges`)
      const badgesData = await badgesRes.json()
      
      if (badgesData.data) {
        setBadges(badgesData.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/profiles/${params.username}/follow`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (data.data) {
        setIsFollowing(data.data.following)
        setProfile(prev => prev ? {
          ...prev,
          follower_count: data.data.following 
            ? prev.follower_count + 1 
            : prev.follower_count - 1
        } : null)
      }
    } catch (err) {
      console.error('Failed to follow:', err)
    }
  }
  
  const handleCopyFormula = async (formulaId: string) => {
    try {
      await copyFormula(formulaId)
      alert('Formula copied to your collection!')
    } catch (err) {
      alert('Failed to copy formula')
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-arena-darker flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-arena-darker flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h1 className="text-xl font-bold text-white mb-2">User Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This user does not exist.'}</p>
            <Link href="/community">
              <Button variant="primary">Browse Community</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-arena-darker">
      {/* Header */}
      <nav className="border-b border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="DegenArena HQ" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text">DegenArena HQ</span>
          </Link>
          <Link href="/community">
            <Button variant="secondary" size="sm">
              Browse Community
            </Button>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-3xl font-bold text-white">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">@{profile.username}</h1>
                  {profile.clan && (
                    <Link 
                      href={`/clans/${profile.clan.slug}`}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-arena-purple/20 text-arena-purple text-sm"
                    >
                      <Shield className="w-3 h-3" />
                      {profile.clan.name}
                    </Link>
                  )}
                </div>
                
                {profile.bio && (
                  <p className="text-gray-400 mb-4">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <strong className="text-white">{profile.follower_count}</strong> followers
                  </span>
                  <span className="flex items-center gap-1">
                    <strong className="text-white">{profile.following_count}</strong> following
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(profile.created_at)}
                  </span>
                  {profile.twitter_handle && (
                    <a 
                      href={`https://twitter.com/${profile.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-arena-cyan hover:underline"
                    >
                      <Twitter className="w-4 h-4" />
                      @{profile.twitter_handle}
                    </a>
                  )}
                </div>
              </div>
              
              {/* Follow button */}
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-2xl font-bold text-white">{profile.stats.total_formulas}</p>
              <p className="text-xs text-gray-500">Formulas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-arena-cyan" />
              <p className="text-2xl font-bold text-white">{profile.stats.avg_win_rate}%</p>
              <p className="text-xs text-gray-500">Avg Win Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-2xl font-bold text-white">{profile.stats.total_matches}</p>
              <p className="text-xs text-gray-500">Total Matches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-white">
                {profile.stats.leaderboard_rank ? `#${profile.stats.leaderboard_rank}` : '—'}
              </p>
              <p className="text-xs text-gray-500">Leaderboard</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Badges */}
        {badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Badges ({badges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={cn(
                      'group relative px-4 py-3 rounded-lg border cursor-default transition-all hover:scale-105',
                      rarityColors[badge.rarity] || rarityColors.common
                    )}
                    title={badge.description}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{badge.name}</p>
                        <p className="text-xs opacity-70 capitalize">{badge.rarity}</p>
                      </div>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-arena-dark border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <p className="text-xs text-gray-300">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Formulas */}
        <Card>
          <CardHeader>
            <CardTitle>Public Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            {formulas.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                No public formulas yet
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {formulas.map((formula) => (
                  <Card key={formula.id} hover className="bg-white/5">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-white mb-2">{formula.name}</h3>
                      {formula.description && (
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{formula.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="text-gray-400">
                          Win: <strong className="text-white">{formula.win_rate}%</strong>
                        </span>
                        <span className="text-gray-400">
                          Return: <strong className={formula.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'}>
                            {formula.avg_return >= 0 ? '+' : ''}{formula.avg_return}%
                          </strong>
                        </span>
                        <span className="text-gray-400">
                          Matches: <strong className="text-white">{formula.total_matches}</strong>
                        </span>
                      </div>
                      
                      {profile.id !== user?.id ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCopyFormula(formula.id)}
                          className="w-full"
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          Copy Formula
                        </Button>
                      ) : (
                        <p className="text-center text-xs text-gray-500 py-2">Your formula</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
