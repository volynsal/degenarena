'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LeaderboardEntry } from '@/types/database'

export type Timeframe = '24h' | '7d' | '30d' | 'all'

export function useLeaderboard(initialTimeframe: Timeframe = '7d') {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe)
  
  const fetchLeaderboard = useCallback(async (tf: Timeframe) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/leaderboard?timeframe=${tf}&limit=50`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard')
      }
      
      setEntries(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchLeaderboard(timeframe)
  }, [timeframe, fetchLeaderboard])
  
  const changeTimeframe = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe)
  }
  
  return {
    entries,
    isLoading,
    error,
    timeframe,
    changeTimeframe,
    refresh: () => fetchLeaderboard(timeframe),
  }
}
