'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useFormula } from '@/lib/hooks/use-formulas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Pause,
  Eye, 
  EyeOff,
  DollarSign,
  Users,
  Clock,
  Shield,
  TrendingUp,
  Loader2,
  Trash2
} from 'lucide-react'

interface FormulaParams {
  name: string
  description: string
  isPublic: boolean
  isActive: boolean
  liquidityMin: number
  liquidityMax: number
  volume24hMin: number
  volume24hSpike: number
  holdersMin: number
  holdersMax: number
  tokenAgeMaxHours: number
  requireVerifiedContract: boolean
  requireHoneypotCheck: boolean
  requireLiquidityLock: boolean
}

export default function EditFormulaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { formula, isLoading, error } = useFormula(params.id)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formParams, setFormParams] = useState<FormulaParams>({
    name: '',
    description: '',
    isPublic: false,
    isActive: false,
    liquidityMin: 50000,
    liquidityMax: 500000,
    volume24hMin: 10000,
    volume24hSpike: 100,
    holdersMin: 100,
    holdersMax: 10000,
    tokenAgeMaxHours: 24,
    requireVerifiedContract: true,
    requireHoneypotCheck: true,
    requireLiquidityLock: false,
  })
  
  // Load formula data into form
  useEffect(() => {
    if (formula) {
      setFormParams({
        name: formula.name,
        description: formula.description || '',
        isPublic: formula.is_public,
        isActive: formula.is_active,
        liquidityMin: formula.liquidity_min || 50000,
        liquidityMax: formula.liquidity_max || 500000,
        volume24hMin: formula.volume_24h_min || 10000,
        volume24hSpike: formula.volume_24h_spike || 100,
        holdersMin: formula.holders_min || 100,
        holdersMax: formula.holders_max || 10000,
        tokenAgeMaxHours: formula.token_age_max_hours || 24,
        requireVerifiedContract: formula.require_verified_contract,
        requireHoneypotCheck: formula.require_honeypot_check,
        requireLiquidityLock: formula.require_liquidity_lock,
      })
    }
  }, [formula])
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const res = await fetch(`/api/formulas/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formParams.name.trim(),
          description: formParams.description?.trim() || null,
          is_public: formParams.isPublic,
          is_active: formParams.isActive,
          liquidity_min: formParams.liquidityMin,
          liquidity_max: formParams.liquidityMax,
          volume_24h_min: formParams.volume24hMin,
          volume_24h_spike: formParams.volume24hSpike,
          holders_min: formParams.holdersMin,
          holders_max: formParams.holdersMax,
          token_age_max_hours: formParams.tokenAgeMaxHours,
          require_verified_contract: formParams.requireVerifiedContract,
          require_honeypot_check: formParams.requireHoneypotCheck,
          require_liquidity_lock: formParams.requireLiquidityLock,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update formula')
      }
      
      router.push('/formulas')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this formula? This cannot be undone.')) return
    
    setIsDeleting(true)
    
    try {
      const res = await fetch(`/api/formulas/${params.id}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete formula')
      }
      
      router.push('/formulas')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const updateParam = <K extends keyof FormulaParams>(key: K, value: FormulaParams[K]) => {
    setFormParams(prev => ({ ...prev, [key]: value }))
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }
  
  if (error || !formula) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error || 'Formula not found'}</p>
        <Link href="/formulas">
          <Button variant="secondary">Back to Formulas</Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/formulas">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Edit Formula</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">Update your token-finding criteria</p>
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="p-4 bg-white/5 rounded-lg space-y-4">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Matches</p>
            <p className="text-base sm:text-lg font-mono text-white">{formula.total_matches}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Win Rate</p>
            <p className="text-base sm:text-lg font-mono text-white">{formula.win_rate}%</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-gray-500">Avg Return</p>
            <p className={`text-base sm:text-lg font-mono ${formula.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'}`}>
              {formula.avg_return >= 0 ? '+' : ''}{formula.avg_return}%
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/formulas/${params.id}/backtest`}>
            <Button variant="secondary" size="sm">
              History
            </Button>
          </Link>
          <Link href={`/formulas/${params.id}/matches`}>
            <Button variant="secondary" size="sm">
              Matches
            </Button>
          </Link>
          {formParams.isPublic && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/f/${params.id}`)
                alert('Share link copied to clipboard!')
              }}
              className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
            >
              Share
            </button>
          )}
        </div>
      </div>
      
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Formula Name"
            placeholder="e.g., Gem Hunter Pro"
            value={formParams.name}
            onChange={(e) => updateParam('name', e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of what this formula targets"
            value={formParams.description}
            onChange={(e) => updateParam('description', e.target.value)}
          />
          
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Public toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                {formParams.isPublic ? (
                  <Eye className="w-5 h-5 text-arena-purple" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-white font-medium">
                    {formParams.isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formParams.isPublic ? 'Visible on leaderboard' : 'Only you can see'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateParam('isPublic', !formParams.isPublic)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  formParams.isPublic ? 'bg-arena-purple' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  formParams.isPublic ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            
            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                {formParams.isActive ? (
                  <Play className="w-5 h-5 text-arena-cyan" fill="currentColor" />
                ) : (
                  <Pause className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="text-white font-medium">
                    {formParams.isActive ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formParams.isActive ? 'Scanning for tokens' : 'Paused'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateParam('isActive', !formParams.isActive)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  formParams.isActive ? 'bg-arena-cyan' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  formParams.isActive ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Liquidity Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Liquidity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Liquidity
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={formParams.liquidityMin}
                  onChange={(e) => updateParam('liquidityMin', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Liquidity
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={formParams.liquidityMax}
                  onChange={(e) => updateParam('liquidityMax', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Volume Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Volume</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum 24h Volume
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={formParams.volume24hMin}
                  onChange={(e) => updateParam('volume24hMin', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volume Spike Threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formParams.volume24hSpike}
                  onChange={(e) => updateParam('volume24hSpike', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
                <span className="text-gray-400">%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Holder Settings - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-gray-400">Holders</CardTitle>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">Coming Soon</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Filter by holder count and distribution. Requires on-chain data integration.
          </p>
        </CardContent>
      </Card>
      
      {/* Token Age */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Token Age</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Age (hours)
            </label>
            <input
              type="number"
              value={formParams.tokenAgeMaxHours}
              onChange={(e) => updateParam('tokenAgeMaxHours', Number(e.target.value))}
              className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Security Checks - Coming Soon */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-gray-400">Security Checks</CardTitle>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">Coming Soon</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Honeypot detection, contract verification, and liquidity lock checks. Requires security API integration.
          </p>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Button 
          variant="ghost" 
          onClick={handleDelete}
          loading={isDeleting}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Formula
        </Button>
        <Button variant="primary" size="lg" onClick={handleSave} loading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function ToggleOption({ 
  enabled, 
  onToggle, 
  title, 
  description 
}: { 
  enabled: boolean
  onToggle: () => void
  title: string
  description: string
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-12 h-7 rounded-full p-1 transition-colors ${
          enabled ? 'bg-arena-cyan' : 'bg-white/20'
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  )
}
