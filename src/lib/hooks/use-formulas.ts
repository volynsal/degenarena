'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Formula, CreateFormulaInput, UpdateFormulaInput, PaginatedResponse } from '@/types/database'

export function useFormulas() {
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  })
  
  const fetchFormulas = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/formulas?page=${page}&pageSize=${pagination.pageSize}`)
      const data: PaginatedResponse<Formula> = await res.json()
      
      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to fetch formulas')
      }
      
      setFormulas(data.data)
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
  }, [pagination.pageSize])
  
  useEffect(() => {
    fetchFormulas()
  }, [fetchFormulas])
  
  const createFormula = async (input: CreateFormulaInput): Promise<Formula | null> => {
    try {
      const res = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create formula')
      }
      
      // Refresh the list
      await fetchFormulas()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }
  
  const updateFormula = async (input: UpdateFormulaInput): Promise<Formula | null> => {
    try {
      const res = await fetch(`/api/formulas/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update formula')
      }
      
      // Update local state
      setFormulas(prev => prev.map(f => f.id === input.id ? data.data : f))
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }
  
  const deleteFormula = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/formulas/${id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete formula')
      }
      
      // Update local state
      setFormulas(prev => prev.filter(f => f.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    }
  }
  
  const toggleActive = async (id: string, isActive: boolean): Promise<boolean> => {
    const result = await updateFormula({ id, is_active: isActive })
    return result !== null
  }
  
  const copyFormula = async (id: string): Promise<Formula | null> => {
    try {
      const res = await fetch(`/api/formulas/${id}/copy`, {
        method: 'POST',
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to copy formula')
      }
      
      // Refresh the list
      await fetchFormulas()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }
  
  return {
    formulas,
    isLoading,
    error,
    pagination,
    fetchFormulas,
    createFormula,
    updateFormula,
    deleteFormula,
    toggleActive,
    copyFormula,
    clearError: () => setError(null),
  }
}

export function useFormula(id: string) {
  const [formula, setFormula] = useState<Formula | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchFormula = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const res = await fetch(`/api/formulas/${id}`)
        const data = await res.json()
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch formula')
        }
        
        setFormula(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchFormula()
    }
  }, [id])
  
  return { formula, isLoading, error }
}
