'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

interface FormulaParams {
  name: string
  description: string
  isPublic: boolean
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

export default function NewFormulaPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [params, setParams] = useState<FormulaParams>({
    name: '',
    description: '',
    isPublic: false,
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
          liquidity_min: params.liquidityMin,
          liquidity_max: params.liquidityMax,
          volume_24h_min: params.volume24hMin,
          volume_24h_spike: params.volume24hSpike,
          holders_min: params.holdersMin,
          holders_max: params.holdersMax,
          token_age_max_hours: params.tokenAgeMaxHours,
          require_verified_contract: params.requireVerifiedContract,
          require_honeypot_check: params.requireHoneypotCheck,
          require_liquidity_lock: params.requireLiquidityLock,
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
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/formulas">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Formula</h1>
            <p className="text-gray-400 mt-1">Define your token-finding criteria</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => handleSave(false)} loading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button variant="primary" onClick={() => handleSave(true)} loading={isSaving}>
            <Play className="w-4 h-4 mr-2" />
            Save & Activate
          </Button>
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
      
      {/* Holder Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Holders</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Holders
              </label>
              <input
                type="number"
                value={params.holdersMin}
                onChange={(e) => updateParam('holdersMin', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Maximum Holders
              </label>
              <input
                type="number"
                value={params.holdersMax}
                onChange={(e) => updateParam('holdersMax', Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
              />
            </div>
          </div>
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
              value={params.tokenAgeMaxHours}
              onChange={(e) => updateParam('tokenAgeMaxHours', Number(e.target.value))}
              className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-arena-purple transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Only match tokens launched within this time</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Security Checks */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-arena-cyan" />
            <CardTitle>Security Checks</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleOption
            enabled={params.requireVerifiedContract}
            onToggle={() => updateParam('requireVerifiedContract', !params.requireVerifiedContract)}
            title="Verified Contract"
            description="Only match tokens with verified source code"
          />
          <ToggleOption
            enabled={params.requireHoneypotCheck}
            onToggle={() => updateParam('requireHoneypotCheck', !params.requireHoneypotCheck)}
            title="Honeypot Check"
            description="Filter out potential honeypot/scam tokens"
          />
          <ToggleOption
            enabled={params.requireLiquidityLock}
            onToggle={() => updateParam('requireLiquidityLock', !params.requireLiquidityLock)}
            title="Liquidity Lock"
            description="Require liquidity to be locked"
          />
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
