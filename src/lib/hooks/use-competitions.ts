import { useState, useEffect, useCallback } from 'react'
import type { Competition, CompetitionLeaderboardEntry } from '@/types/database'

export function useCompetitions(initialStatus?: string) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(initialStatus || 'active')
  
  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.set('status', status)
      }
      
      const res = await fetch(`/api/competitions?${params}`)
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setCompetitions(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch competitions')
    } finally {
      setIsLoading(false)
    }
  }, [status])
  
  useEffect(() => {
    fetchCompetitions()
  }, [fetchCompetitions])
  
  const changeStatus = (newStatus: string) => {
    setStatus(newStatus)
  }
  
  return {
    competitions,
    isLoading,
    error,
    status,
    changeStatus,
    refresh: fetchCompetitions,
  }
}

export function useCompetition(id: string) {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEntering, setIsEntering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchCompetition = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [compRes, leaderboardRes] = await Promise.all([
        fetch(`/api/competitions/${id}`),
        fetch(`/api/competitions/${id}/leaderboard`),
      ])
      
      const compData = await compRes.json()
      const leaderboardData = await leaderboardRes.json()
      
      if (compData.error) {
        throw new Error(compData.error)
      }
      
      setCompetition(compData.data)
      setLeaderboard(leaderboardData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch competition')
    } finally {
      setIsLoading(false)
    }
  }, [id])
  
  useEffect(() => {
    if (id) {
      fetchCompetition()
    }
  }, [id, fetchCompetition])
  
  const enterCompetition = async (formulaId: string): Promise<boolean> => {
    setIsEntering(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/competitions/${id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula_id: formulaId }),
      })
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Refresh competition data
      await fetchCompetition()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enter competition')
      return false
    } finally {
      setIsEntering(false)
    }
  }
  
  const withdrawFromCompetition = async (): Promise<boolean> => {
    setIsEntering(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/competitions/${id}/enter`, {
        method: 'DELETE',
      })
      
      const data = await res.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      // Refresh competition data
      await fetchCompetition()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw')
      return false
    } finally {
      setIsEntering(false)
    }
  }
  
  return {
    competition,
    leaderboard,
    isLoading,
    isEntering,
    error,
    enterCompetition,
    withdrawFromCompetition,
    refresh: fetchCompetition,
  }
}
