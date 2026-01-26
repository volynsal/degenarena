'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserStats {
  total_formulas: number
  active_formulas: number
  total_matches: number
  overall_win_rate: number
  overall_avg_return: number
  best_formula: {
    id: string
    name: string
    win_rate: number
  } | null
  leaderboard_rank: number | null
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/stats')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }
      
      setStats(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchStats()
  }, [fetchStats])
  
  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  }
}
