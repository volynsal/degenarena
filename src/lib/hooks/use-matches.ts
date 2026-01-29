'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TokenMatch, PaginatedResponse } from '@/types/database'

export function useFormulaMatches(formulaId: string) {
  const [matches, setMatches] = useState<TokenMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  })
  
  const fetchMatches = useCallback(async (page = 1) => {
    if (!formulaId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/formulas/${formulaId}/matches?page=${page}&pageSize=${pagination.pageSize}`)
      const data: PaginatedResponse<TokenMatch> = await res.json()
      
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to fetch matches')
      }
      
      setMatches(data.data)
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        hasMore: data.hasMore,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [formulaId, pagination.pageSize])
  
  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])
  
  return {
    matches,
    isLoading,
    error,
    pagination,
    fetchMatches,
    loadMore: () => fetchMatches(pagination.page + 1),
  }
}

// Hook for fetching recent matches across all user's formulas
export function useRecentMatches(limit = 10) {
  const [matches, setMatches] = useState<TokenMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchRecentMatches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/matches/recent?limit=${limit}`)
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch recent matches')
      }
      
      setMatches(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [limit])
  
  useEffect(() => {
    fetchRecentMatches()
  }, [fetchRecentMatches])
  
  return {
    matches,
    isLoading,
    error,
    refresh: fetchRecentMatches,
    mutate: fetchRecentMatches,
  }
}
