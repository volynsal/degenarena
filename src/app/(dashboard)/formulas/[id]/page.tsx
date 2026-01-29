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
  Trash2,
  Target,
  BarChart3,
  Zap,
  Lock
} from 'lucide-react'
import type { SubscriptionTier } from '@/types/database'
import { FORMULA_PRESETS, RISK_COLORS, STRATEGY_COLORS, STRATEGY_LABELS, type FormulaPreset } from '@/lib/formula-presets'

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
  // Enhanced parameters
  tokenAgeMinMinutes: number
  buySellRatio1hMin: number
  txCount1hMin: number
  txCount24hMin: number
  fdvMin: number
  fdvMax: number
  priceChange1hMin: number
  priceChange1hMax: number
  priceChange6hMin: number
  priceChange6hMax: number
  priceChange24hMin: number
  priceChange24hMax: number
  volume1hVs6hSpike: number
  volume6hVs24hSpike: number
  // RugCheck
  requireRugcheck: boolean
  rugcheckMinScore: number
}

export default function EditFormulaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { formula, isLoading, error } = useFormula(params.id)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<SubscriptionTier>('free')
  
  const [showAdvanced, setShowAdvanced] = useState(false)
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
    // Enhanced parameters
    tokenAgeMinMinutes: 0,
    buySellRatio1hMin: 0,
    txCount1hMin: 0,
    txCount24hMin: 0,
    fdvMin: 0,
    fdvMax: 0,
    priceChange1hMin: 0,
    priceChange1hMax: 0,
    priceChange6hMin: 0,
    priceChange6hMax: 0,
    priceChange24hMin: 0,
    priceChange24hMax: 0,
    volume1hVs6hSpike: 0,
    volume6hVs24hSpike: 0,
    // RugCheck
    requireRugcheck: false,
    rugcheckMinScore: 30,
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
        // Enhanced parameters
        tokenAgeMinMinutes: formula.token_age_min_minutes || 0,
        buySellRatio1hMin: formula.buy_sell_ratio_1h_min || 0,
        txCount1hMin: formula.tx_count_1h_min || 0,
        txCount24hMin: formula.tx_count_24h_min || 0,
        fdvMin: formula.fdv_min || 0,
        fdvMax: formula.fdv_max || 0,
        priceChange1hMin: formula.price_change_1h_min || 0,
        priceChange1hMax: formula.price_change_1h_max || 0,
        priceChange6hMin: formula.price_change_6h_min || 0,
        priceChange6hMax: formula.price_change_6h_max || 0,
        priceChange24hMin: formula.price_change_24h_min || 0,
        priceChange24hMax: formula.price_change_24h_max || 0,
        volume1hVs6hSpike: formula.volume_1h_vs_6h_spike || 0,
        volume6hVs24hSpike: formula.volume_6h_vs_24h_spike || 0,
        // RugCheck
        requireRugcheck: formula.require_rugcheck || false,
        rugcheckMinScore: formula.rugcheck_min_score || 30,
      })
      // Show advanced if any advanced params are set
      if (formula.buy_sell_ratio_1h_min || formula.tx_count_1h_min || formula.price_change_1h_min || formula.volume_1h_vs_6h_spike) {
        setShowAdvanced(true)
      }
      // Set selected preset if formula has one
      if (formula.preset_id) {
        setSelectedPreset(formula.preset_id)
      }
    }
  }, [formula])
  
  // Fetch user tier
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.data?.subscription_tier) {
            setUserTier(data.data.subscription_tier)
          }
        }
      } catch (err) {
        console.error('Failed to fetch user tier:', err)
      }
    }
    fetchUserTier()
  }, [])
  
  // Apply preset values to form
  const applyPreset = (preset: FormulaPreset) => {
    const p = preset.parameters
    setFormParams(prev => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      liquidityMin: p.liquidity_min ?? prev.liquidityMin,
      liquidityMax: p.liquidity_max ?? prev.liquidityMax,
      volume24hMin: p.volume_24h_min ?? prev.volume24hMin,
      volume24hSpike: p.volume_24h_spike ?? prev.volume24hSpike,
      tokenAgeMaxHours: p.token_age_max_hours ?? prev.tokenAgeMaxHours,
      tokenAgeMinMinutes: p.token_age_min_minutes ?? prev.tokenAgeMinMinutes,
      buySellRatio1hMin: p.buy_sell_ratio_1h_min ?? prev.buySellRatio1hMin,
      txCount1hMin: p.tx_count_1h_min ?? prev.txCount1hMin,
      txCount24hMin: p.tx_count_24h_min ?? prev.txCount24hMin,
      fdvMin: p.fdv_min ?? prev.fdvMin,
      fdvMax: p.fdv_max ?? prev.fdvMax,
      priceChange1hMin: p.price_change_1h_min ?? prev.priceChange1hMin,
      priceChange1hMax: p.price_change_1h_max ?? prev.priceChange1hMax,
      priceChange6hMin: p.price_change_6h_min ?? prev.priceChange6hMin,
      priceChange6hMax: p.price_change_6h_max ?? prev.priceChange6hMax,
      priceChange24hMin: p.price_change_24h_min ?? prev.priceChange24hMin,
      priceChange24hMax: p.price_change_24h_max ?? prev.priceChange24hMax,
      volume1hVs6hSpike: p.volume_1h_vs_6h_spike ?? prev.volume1hVs6hSpike,
      volume6hVs24hSpike: p.volume_6h_vs_24h_spike ?? prev.volume6hVs24hSpike,
      requireRugcheck: preset.requireRugcheck ?? true,
      rugcheckMinScore: preset.rugcheckMinScore ?? 30,
    }))
    if (p.buy_sell_ratio_1h_min || p.tx_count_1h_min || p.price_change_1h_min || p.volume_1h_vs_6h_spike) {
      setShowAdvanced(true)
    }
  }
  
  const handlePresetClick = (preset: FormulaPreset) => {
    if (userTier === 'free') {
      alert('Upgrade to Pro to use strategy presets!')
      return
    }
    if (userTier === 'pro' && preset.tier === 'elite') {
      alert('Upgrade to Elite to use this preset!')
      return
    }
    if (selectedPreset === preset.id) {
      setSelectedPreset(null)
    } else {
      setSelectedPreset(preset.id)
      applyPreset(preset)
    }
  }
  
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
          // Enhanced parameters
          token_age_min_minutes: formParams.tokenAgeMinMinutes || null,
          buy_sell_ratio_1h_min: formParams.buySellRatio1hMin || null,
          tx_count_1h_min: formParams.txCount1hMin || null,
          tx_count_24h_min: formParams.txCount24hMin || null,
          fdv_min: formParams.fdvMin || null,
          fdv_max: formParams.fdvMax || null,
          price_change_1h_min: formParams.priceChange1hMin || null,
          price_change_1h_max: formParams.priceChange1hMax || null,
          price_change_6h_min: formParams.priceChange6hMin || null,
          price_change_6h_max: formParams.priceChange6hMax || null,
          price_change_24h_min: formParams.priceChange24hMin || null,
          price_change_24h_max: formParams.priceChange24hMax || null,
          volume_1h_vs_6h_spike: formParams.volume1hVs6hSpike || null,
          volume_6h_vs_24h_spike: formParams.volume6hVs24hSpike || null,
          // RugCheck
          require_rugcheck: formParams.requireRugcheck,
          rugcheck_min_score: formParams.rugcheckMinScore,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Formula</h1>
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
      
      {/* Strategy Presets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-arena-purple" />
              <CardTitle>Strategy Presets</CardTitle>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-arena-purple/20 text-arena-purple border border-arena-purple/30">
              Pro Feature
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-2">
            Apply pre-configured parameters from proven strategies. {userTier === 'free' ? 'Upgrade to Pro to unlock.' : 'Click to auto-fill parameters.'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Exit times are suggestions only. You are responsible for your own trading decisions.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FORMULA_PRESETS.map((preset) => {
              const isLocked = userTier === 'free' || (userTier === 'pro' && preset.tier === 'elite')
              const isSelected = selectedPreset === preset.id
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetClick(preset)}
                  className={`relative p-4 rounded-lg border text-left transition-all ${
                    isLocked 
                      ? 'border-white/10 bg-white/5 opacity-60 cursor-not-allowed' 
                      : isSelected
                        ? 'border-arena-purple bg-arena-purple/20 ring-2 ring-arena-purple/50 cursor-pointer'
                        : 'border-white/20 bg-white/5 hover:border-arena-purple/50 hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400">{preset.tier === 'elite' ? 'Elite' : 'Pro'}</span>
                      </div>
                    </div>
                  )}
                  
                  {isSelected && !isLocked && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-arena-purple text-white font-medium">
                        Active
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-white">{preset.name}</h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${RISK_COLORS[preset.riskLevel]}`}>
                      {preset.riskLevel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{preset.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${STRATEGY_COLORS[preset.strategy]}`}>
                      {STRATEGY_LABELS[preset.strategy]}
                    </span>
                    <span className="text-xs text-gray-500" title="Suggested exit window">
                      Exit: {preset.holdTime}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
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
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Age (minutes)
              </label>
              <input
                type="number"
                value={formParams.tokenAgeMinMinutes || ''}
                onChange={(e) => updateParam('tokenAgeMinMinutes', Number(e.target.value))}
                placeholder="e.g., 10"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Skip first X minutes (avoid bot wars)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Age (hours)
              </label>
              <input
                type="number"
                value={formParams.tokenAgeMaxHours || ''}
                onChange={(e) => updateParam('tokenAgeMaxHours', Number(e.target.value))}
                placeholder="e.g., 24"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Market Cap / FDV */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Market Cap (FDV)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Market Cap
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={formParams.fdvMin || ''}
                  onChange={(e) => updateParam('fdvMin', Number(e.target.value))}
                  placeholder="e.g., 50000"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Market Cap
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={formParams.fdvMax || ''}
                  onChange={(e) => updateParam('fdvMax', Number(e.target.value))}
                  placeholder="e.g., 5000000"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
      >
        <Target className="w-5 h-5" />
        <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Filters</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-arena-cyan/20 text-arena-cyan">
          Pro Strategies
        </span>
      </button>
      
      {showAdvanced && (
        <>
          {/* Buy/Sell & Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-arena-cyan" />
                <CardTitle>Buy Pressure & Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Buy/Sell Ratio (1h)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formParams.buySellRatio1hMin || ''}
                    onChange={(e) => updateParam('buySellRatio1hMin', Number(e.target.value))}
                    placeholder="e.g., 1.5"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">1.5 = 50% more buys than sells</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Transactions (1h)
                  </label>
                  <input
                    type="number"
                    value={formParams.txCount1hMin || ''}
                    onChange={(e) => updateParam('txCount1hMin', Number(e.target.value))}
                    placeholder="e.g., 50"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Price Change Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-arena-purple" />
                <CardTitle>Price Change Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1 Hour Price Change (%)
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Min:</span>
                    <input
                      type="number"
                      value={formParams.priceChange1hMin || ''}
                      onChange={(e) => updateParam('priceChange1hMin', Number(e.target.value))}
                      placeholder="-20"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Max:</span>
                    <input
                      type="number"
                      value={formParams.priceChange1hMax || ''}
                      onChange={(e) => updateParam('priceChange1hMax', Number(e.target.value))}
                      placeholder="100"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  24 Hour Price Change (%)
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Min:</span>
                    <input
                      type="number"
                      value={formParams.priceChange24hMin || ''}
                      onChange={(e) => updateParam('priceChange24hMin', Number(e.target.value))}
                      placeholder="-50"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Max:</span>
                    <input
                      type="number"
                      value={formParams.priceChange24hMax || ''}
                      onChange={(e) => updateParam('priceChange24hMax', Number(e.target.value))}
                      placeholder="200"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Volume Spike Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <CardTitle>Volume Spike Detection</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    1h vs 6h Volume Spike
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formParams.volume1hVs6hSpike || ''}
                      onChange={(e) => updateParam('volume1hVs6hSpike', Number(e.target.value))}
                      placeholder="e.g., 3.0"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">x</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">3.0 = current hour has 3x normal volume</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    6h vs 24h Volume Ratio
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={formParams.volume6hVs24hSpike || ''}
                      onChange={(e) => updateParam('volume6hVs24hSpike', Number(e.target.value))}
                      placeholder="e.g., 0.7"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">x</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Below 1.0 = volume decreasing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* RugCheck.xyz Safety */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-arena-cyan" />
              <CardTitle>RugCheck.xyz Safety</CardTitle>
            </div>
            {formParams.requireRugcheck && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                Enabled
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">
            Filter tokens using RugCheck.xyz safety analysis. Lower scores = safer tokens.
          </p>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
            <div>
              <p className="text-white font-medium">Enable RugCheck</p>
              <p className="text-sm text-gray-400">
                {formParams.requireRugcheck 
                  ? 'Tokens must pass safety analysis' 
                  : 'No safety filtering'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateParam('requireRugcheck', !formParams.requireRugcheck)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                formParams.requireRugcheck ? 'bg-arena-cyan' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                formParams.requireRugcheck ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
          
          {formParams.requireRugcheck && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Risk Score (0-50)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={formParams.rugcheckMinScore}
                    onChange={(e) => updateParam('rugcheckMinScore', Number(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-arena-cyan"
                  />
                  <span className={`text-lg font-bold min-w-[3rem] text-center ${
                    formParams.rugcheckMinScore <= 15 ? 'text-green-400' :
                    formParams.rugcheckMinScore <= 30 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {formParams.rugcheckMinScore}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Strict (≤15)</span>
                  <span>Standard (≤30)</span>
                  <span>Lenient (≤50)</span>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 font-medium mb-1">Universal Red Flags (Auto-Reject)</p>
                <ul className="text-xs text-red-300 space-y-0.5">
                  <li>• Creator rug history</li>
                  <li>• LP not locked</li>
                  <li>• Creator holds &gt;10%</li>
                  <li>• Risk score &gt;50</li>
                </ul>
              </div>
            </div>
          )}
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
