'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AlertSettings, UpdateAlertSettingsInput } from '@/types/database'

export function useAlertSettings() {
  const [settings, setSettings] = useState<AlertSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/alert-settings')
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch alert settings')
      }
      
      setSettings(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])
  
  const saveSettings = async (input: UpdateAlertSettingsInput): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/alert-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save alert settings')
      }
      
      setSettings(data.data)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setIsSaving(false)
    }
  }
  
  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    refresh: fetchSettings,
    clearError: () => setError(null),
  }
}
