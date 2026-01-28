'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Trophy, 
  Star,
  ArrowUp,
  Copy,
  Users,
  Target,
  Loader2,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormulas } from '@/lib/hooks/use-formulas'
import { useAuthStore } from '@/lib/stores/auth-store'

interface CommunityFormula {
  id: string
  name: string
  description: string | null
  user_id: string
  username: string
  avatar_url: string | null
  win_rate: number
  total_matches: number
  avg_return: number
  upvote_count: number
  copy_count: number
  created_at: string
  has_upvoted: boolean
}

const sortOptions = [
  { value: 'trending', label: 'Trending', icon: TrendingUp },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Most Upvoted', icon: ArrowUp },
  { value: 'best', label: 'Best Win Rate', icon: Trophy },
]

export default function CommunityPage() {
  const [formulas, setFormulas] = useState<CommunityFormula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sort, setSort] = useState('trending')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const { copyFormula } = useFormulas()
  const { user } = useAuthStore()
  
  const fetchFormulas = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/community?${params}`)
      const data = await res.json()
      
      if (data.data) {
        setFormulas(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch community formulas:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchFormulas()
  }, [sort, search])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }
  
  const handleUpvote = async (formulaId: string) => {
    try {
      const res = await fetch(`/api/community/${formulaId}/upvote`, {
        method: 'POST',
      })
      const data = await res.json()
      
      if (data.data) {
        // Update local state
        setFormulas(prev => prev.map(f => {
          if (f.id === formulaId) {
            return {
              ...f,
              has_upvoted: data.data.upvoted,
              upvote_count: data.data.upvoted ? f.upvote_count + 1 : f.upvote_count - 1,
            }
          }
          return f
        }))
      }
    } catch (err) {
      console.error('Failed to upvote:', err)
    }
  }
  
  const handleCopy = async (formulaId: string) => {
    try {
      await copyFormula(formulaId)
      alert('Formula copied to your collection!')
      // Update copy count locally
      setFormulas(prev => prev.map(f => {
        if (f.id === formulaId) {
          return { ...f, copy_count: f.copy_count + 1 }
        }
        return f
      }))
    } catch (err) {
      alert('Failed to copy formula')
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          <span className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 bg-clip-text text-transparent">
            Community
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Discover and copy winning formulas from top traders</p>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search formulas..."
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
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                sort === option.value
                  ? 'bg-gradient-to-r from-arena-purple to-arena-cyan text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <option.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Formulas grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
        </div>
      ) : formulas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-white mb-2">No formulas found</h3>
            <p className="text-gray-400">
              {search 
                ? 'Try a different search term'
                : 'Be the first to share a public formula!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formulas.map((formula) => (
            <Card key={formula.id} hover className="group">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-arena-cyan transition-colors">
                      {formula.name}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      by <span className="text-arena-cyan">@{formula.username}</span>
                    </p>
                  </div>
                  
                  {/* Upvote button */}
                  <button
                    onClick={() => handleUpvote(formula.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                      formula.has_upvoted
                        ? 'bg-arena-cyan/20 text-arena-cyan'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <ArrowUp className={cn('w-4 h-4', formula.has_upvoted && 'fill-current')} />
                    <span className="text-xs font-medium">{formula.upvote_count}</span>
                  </button>
                </div>
                
                {/* Description */}
                {formula.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {formula.description}
                  </p>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{formula.win_rate}%</p>
                    <p className="text-xs text-gray-500">Win Rate</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className={cn(
                      'text-lg font-bold',
                      formula.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'
                    )}>
                      {formula.avg_return >= 0 ? '+' : ''}{formula.avg_return}%
                    </p>
                    <p className="text-xs text-gray-500">Avg Return</p>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{formula.total_matches}</p>
                    <p className="text-xs text-gray-500">Matches</p>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      {formula.copy_count} copies
                    </span>
                    <span>{formatDate(formula.created_at)}</span>
                  </div>
                  
                  {formula.user_id !== user?.id ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCopy(formula.id)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500 italic">Your formula</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
