import { useState, useEffect, useCallback } from 'react'
import type { Competition, CompetitionLeaderboardEntry, CompetitionTab, UserXp, TierName } from '@/types/database'

export function useCompetitions(initialTab?: CompetitionTab) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('active')
  const [tab, setTab] = useState<CompetitionTab | 'all'>(initialTab || 'all')

  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.set('status', status)
      }
      if (tab && tab !== 'all') {
        params.set('tab', tab)
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
  }, [status, tab])

  useEffect(() => {
    fetchCompetitions()
  }, [fetchCompetitions])

  const changeStatus = (newStatus: string) => {
    setStatus(newStatus)
  }

  const changeTab = (newTab: CompetitionTab | 'all') => {
    setTab(newTab)
  }

  return {
    competitions,
    isLoading,
    error,
    status,
    tab,
    changeStatus,
    changeTab,
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

  // Poll leaderboard every 60 seconds for live competitions
  useEffect(() => {
    if (competition?.live_status === 'live') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/competitions/${id}/leaderboard`)
          const data = await res.json()
          if (data.data) setLeaderboard(data.data)
        } catch {}
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [id, competition?.live_status])

  const enterCompetition = async (): Promise<boolean> => {
    setIsEntering(true)
    setError(null)

    try {
      const res = await fetch(`/api/competitions/${id}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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

export function useUserXp() {
  const [xp, setXp] = useState<UserXp | null>(null)
  const [progress, setProgress] = useState<{
    current_tier: TierName
    next_tier: TierName | null
    xp_current: number
    xp_for_next: number | null
    percent: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchXp = useCallback(async () => {
    try {
      const res = await fetch('/api/user/xp')
      const data = await res.json()
      if (data.data) setXp(data.data)
      if (data.progress) setProgress(data.progress)
    } catch {} finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchXp()
  }, [fetchXp])

  return { xp, progress, isLoading, refresh: fetchXp }
}
