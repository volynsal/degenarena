'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionTier } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Eye, 
  EyeOff,
  Info,
  DollarSign,
  Users,
  Clock,
  Shield,
  TrendingUp,
  Lock,
  Zap,
  Target,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { FORMULA_PRESETS, RISK_COLORS, STRATEGY_COLORS, STRATEGY_LABELS, type FormulaPreset } from '@/lib/formula-presets'

interface FormulaParams {
  name: string
  description: string
  isPublic: boolean
  // Basic parameters
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
}

export default function NewFormulaPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [params, setParams] = useState<FormulaParams>({
    name: '',
    description: '',
    isPublic: false,
    // Basic parameters
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
    // Enhanced parameters (0 means not set)
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
  })
  
  const handleSave = async (activate = false) => {
    if (!params.name.trim()) {
      alert('Please enter a formula name')
      return
    }
    
    setIsSaving(true)
    
    try {
      const res = await fetch('/api/formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name.trim(),
          description: params.description?.trim() || null,
          is_public: params.isPublic,
          is_active: activate,
          // Basic parameters
          liquidity_min: params.liquidityMin || null,
          liquidity_max: params.liquidityMax || null,
          volume_24h_min: params.volume24hMin || null,
          volume_24h_spike: params.volume24hSpike || null,
          holders_min: params.holdersMin || null,
          holders_max: params.holdersMax || null,
          token_age_max_hours: params.tokenAgeMaxHours || null,
          require_verified_contract: params.requireVerifiedContract,
          require_honeypot_check: params.requireHoneypotCheck,
          require_liquidity_lock: params.requireLiquidityLock,
          // Enhanced parameters (only send if set)
          token_age_min_minutes: params.tokenAgeMinMinutes || null,
          buy_sell_ratio_1h_min: params.buySellRatio1hMin || null,
          tx_count_1h_min: params.txCount1hMin || null,
          tx_count_24h_min: params.txCount24hMin || null,
          fdv_min: params.fdvMin || null,
          fdv_max: params.fdvMax || null,
          price_change_1h_min: params.priceChange1hMin || null,
          price_change_1h_max: params.priceChange1hMax || null,
          price_change_6h_min: params.priceChange6hMin || null,
          price_change_6h_max: params.priceChange6hMax || null,
          price_change_24h_min: params.priceChange24hMin || null,
          price_change_24h_max: params.priceChange24hMax || null,
          volume_1h_vs_6h_spike: params.volume1hVs6hSpike || null,
          volume_6h_vs_24h_spike: params.volume6hVs24hSpike || null,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create formula')
      }
      
      // If activated, trigger immediate scan
      if (activate && data.data?.id) {
        try {
          const scanRes = await fetch(`/api/formulas/${data.data.id}/scan`, {
            method: 'POST',
          })
          const scanData = await scanRes.json()
          
          if (scanData.data?.matches > 0) {
            alert(`Formula created! Found ${scanData.data.matches} matching token(s).`)
          }
        } catch (scanErr) {
          // Scan failed but formula was created, continue anyway
          console.error('Scan failed:', scanErr)
        }
      }
      
      router.push('/formulas')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }
  
  const updateParam = <K extends keyof FormulaParams>(key: K, value: FormulaParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }
  
  // Apply preset values to form
  const applyPreset = (preset: FormulaPreset) => {
    const p = preset.parameters
    setParams(prev => ({
      ...prev,
      name: preset.name,
      description: preset.description,
      // Map preset parameters to form state
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
    }))
    // Show advanced filters if preset uses them
    if (p.buy_sell_ratio_1h_min || p.tx_count_1h_min || p.price_change_1h_min || p.volume_1h_vs_6h_spike) {
      setShowAdvanced(true)
    }
  }
  
  // Fetch user's subscription tier
  const [userTier, setUserTier] = useState<SubscriptionTier>('free')
  
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
  
  const handlePresetClick = (preset: FormulaPreset) => {
    // Check if user has access
    if (userTier === 'free') {
      alert('Upgrade to Pro to use strategy presets!')
      return
    }
    if (userTier === 'pro' && preset.tier === 'elite') {
      alert('Upgrade to Elite to use this preset!')
      return
    }
    // Toggle selection - clicking same preset deselects it
    if (selectedPreset === preset.id) {
      setSelectedPreset(null)
    } else {
      setSelectedPreset(preset.id)
      applyPreset(preset)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/formulas">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Create Formula</h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1">Define your token-finding criteria</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleSave(false)} loading={isSaving} className="flex-1 sm:flex-none">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => handleSave(true)} loading={isSaving} className="flex-1 sm:flex-none">
            <Play className="w-4 h-4 mr-2" />
            Save & Activate
          </Button>
        </div>
      </div>
      
      {/* Strategy Presets - Locked for Free Users */}
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
            Pre-configured formulas based on proven trading strategies. {userTier === 'free' ? 'Upgrade to Pro to unlock.' : 'Click to auto-fill parameters.'}
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
                  {/* Lock overlay for locked presets */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400">{preset.tier === 'elite' ? 'Elite' : 'Pro'}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Selected indicator */}
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
            value={params.name}
            onChange={(e) => updateParam('name', e.target.value)}
          />
          <Input
            label="Description (optional)"
            placeholder="Brief description of what this formula targets"
            value={params.description}
            onChange={(e) => updateParam('description', e.target.value)}
          />
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-3">
              {params.isPublic ? (
                <Eye className="w-5 h-5 text-arena-purple" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-white font-medium">
                  {params.isPublic ? 'Public Formula' : 'Private Formula'}
                </p>
                <p className="text-sm text-gray-400">
                  {params.isPublic 
                    ? 'Others can see and copy your formula'
                    : 'Only you can see this formula'}
                </p>
              </div>
            </div>
            <button
              onClick={() => updateParam('isPublic', !params.isPublic)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                params.isPublic ? 'bg-arena-purple' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                params.isPublic ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
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
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Liquidity
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  value={params.liquidityMin}
                  onChange={(e) => updateParam('liquidityMin', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                  value={params.liquidityMax}
                  onChange={(e) => updateParam('liquidityMax', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                />
              </div>
            </div>
          </div>
          
          {/* Visual slider representation */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>${params.liquidityMin.toLocaleString()}</span>
              <span>${params.liquidityMax.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-arena-purple to-arena-cyan rounded-full"
                style={{ 
                  width: `${Math.min(100, (params.liquidityMax / 1000000) * 100)}%`,
                  marginLeft: `${(params.liquidityMin / 1000000) * 100}%`
                }}
              />
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
                  value={params.volume24hMin}
                  onChange={(e) => updateParam('volume24hMin', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                  value={params.volume24hSpike}
                  onChange={(e) => updateParam('volume24hSpike', Number(e.target.value))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                />
                <span className="text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Alert when volume increases by this %</p>
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
                value={params.tokenAgeMinMinutes || ''}
                onChange={(e) => updateParam('tokenAgeMinMinutes', Number(e.target.value))}
                placeholder="e.g., 10"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Skip first X minutes (avoid bot wars)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Age (hours)
              </label>
              <input
                type="number"
                value={params.tokenAgeMaxHours || ''}
                onChange={(e) => updateParam('tokenAgeMaxHours', Number(e.target.value))}
                placeholder="e.g., 24"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">Only match tokens within this age</p>
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
                  value={params.fdvMin || ''}
                  onChange={(e) => updateParam('fdvMin', Number(e.target.value))}
                  placeholder="e.g., 50000"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                  value={params.fdvMax || ''}
                  onChange={(e) => updateParam('fdvMax', Number(e.target.value))}
                  placeholder="e.g., 5000000"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                    value={params.buySellRatio1hMin || ''}
                    onChange={(e) => updateParam('buySellRatio1hMin', Number(e.target.value))}
                    placeholder="e.g., 1.5"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">1.5 = 50% more buys than sells</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Transactions (1h)
                  </label>
                  <input
                    type="number"
                    value={params.txCount1hMin || ''}
                    onChange={(e) => updateParam('txCount1hMin', Number(e.target.value))}
                    placeholder="e.g., 50"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum activity level</p>
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
              {/* 1h Price Change */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  1 Hour Price Change (%)
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Min:</span>
                    <input
                      type="number"
                      value={params.priceChange1hMin || ''}
                      onChange={(e) => updateParam('priceChange1hMin', Number(e.target.value))}
                      placeholder="-20"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Max:</span>
                    <input
                      type="number"
                      value={params.priceChange1hMax || ''}
                      onChange={(e) => updateParam('priceChange1hMax', Number(e.target.value))}
                      placeholder="100"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
              </div>
              
              {/* 24h Price Change */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  24 Hour Price Change (%)
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Min:</span>
                    <input
                      type="number"
                      value={params.priceChange24hMin || ''}
                      onChange={(e) => updateParam('priceChange24hMin', Number(e.target.value))}
                      placeholder="-50"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Max:</span>
                    <input
                      type="number"
                      value={params.priceChange24hMax || ''}
                      onChange={(e) => updateParam('priceChange24hMax', Number(e.target.value))}
                      placeholder="200"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                      value={params.volume1hVs6hSpike || ''}
                      onChange={(e) => updateParam('volume1hVs6hSpike', Number(e.target.value))}
                      placeholder="e.g., 3.0"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
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
                      value={params.volume6hVs24hSpike || ''}
                      onChange={(e) => updateParam('volume6hVs24hSpike', Number(e.target.value))}
                      placeholder="e.g., 0.7"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
                    />
                    <span className="text-gray-400">x</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Below 1.0 = volume decreasing (quiet accumulation)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
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
      
      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-arena-purple/10 border border-arena-purple/20">
        <Info className="w-5 h-5 text-arena-purple flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white font-medium">How formulas work</p>
          <p className="text-sm text-gray-400 mt-1">
            Your formula will continuously monitor new token launches on Solana. 
            When a token matches all your criteria, you&apos;ll receive an instant alert 
            and the match will be tracked for performance analytics.
          </p>
        </div>
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
