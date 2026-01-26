'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Search, 
  Users, 
  Trophy,
  TrendingUp,
  Plus,
  Loader2,
  Shield,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Clan {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  member_count: number
  total_matches: number
  avg_win_rate: number
  owner_username: string
}

const sortOptions = [
  { value: 'top', label: 'Top Rated' },
  { value: 'members', label: 'Most Members' },
  { value: 'new', label: 'Newest' },
]

export default function ClansPage() {
  const [clans, setClans] = useState<Clan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sort, setSort] = useState('top')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  
  const fetchClans = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/clans?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setClans(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch clans:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchClans()
  }, [sort, search])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clans</h1>
          <p className="text-gray-400 mt-1">Join a clan or create your own trading team</p>
        </div>
        <Link href="/clans/create">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Clan
          </Button>
        </Link>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search clans..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        
        {/* Sort options */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSort(option.value)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                sort === option.value
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Clans list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : clans.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No clans found</h3>
            <p className="text-gray-400 mb-6">
              {search ? 'Try a different search term' : 'Be the first to create a clan!'}
            </p>
            <Link href="/clans/create">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Clan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clans.map((clan) => (
            <Link key={clan.id} href={`/clans/${clan.slug}`}>
              <Card hover className="h-full">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-arena-purple to-arena-cyan flex items-center justify-center text-xl font-bold text-white">
                      {clan.logo_url ? (
                        <img src={clan.logo_url} alt={clan.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        clan.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{clan.name}</h3>
                      <p className="text-sm text-gray-400">by @{clan.owner_username}</p>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {clan.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {clan.description}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <Users className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                      <p className="text-lg font-bold text-white">{clan.member_count}</p>
                      <p className="text-xs text-gray-500">Members</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <Trophy className="w-4 h-4 mx-auto mb-1 text-arena-cyan" />
                      <p className="text-lg font-bold text-white">{clan.avg_win_rate}%</p>
                      <p className="text-xs text-gray-500">Win Rate</p>
                    </div>
                    <div className="text-center p-2 bg-white/5 rounded-lg">
                      <Target className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                      <p className="text-lg font-bold text-white">{clan.total_matches}</p>
                      <p className="text-xs text-gray-500">Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
