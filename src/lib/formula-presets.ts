// Formula Presets - Available to paid subscribers
// Each preset has optimized parameters based on proven trading strategies

import type { CreateFormulaInput } from '@/types/database'

export interface FormulaPreset {
  id: string
  name: string
  description: string
  tier: 'pro' | 'elite' // Minimum subscription tier required
  strategy: 'launch_sniper' | 'momentum' | 'accumulation' | 'cex_ready'
  riskLevel: 'low' | 'medium' | 'high' | 'degen'
  holdTime: string // Expected hold duration
  parameters: Partial<CreateFormulaInput>
  // Safety settings (presets have RugCheck enabled by default)
  requireRugcheck?: boolean
  rugcheckMinScore?: number
  // Social momentum (LunarCrush Galaxy Score)
  requireGalaxyScore?: boolean
  galaxyScoreMin?: number
}

export const FORMULA_PRESETS: FormulaPreset[] = [
  // === LAUNCH SNIPER PRESETS ===
  {
    id: 'launch_sniper_conservative',
    name: 'Launch Sniper (Safe)',
    description: 'Catch new tokens with strong early signals. Waits for initial chaos to settle.',
    tier: 'pro',
    strategy: 'launch_sniper',
    riskLevel: 'medium',
    holdTime: '1-24 hours',
    requireRugcheck: true,
    rugcheckMinScore: 25, // Conservative - "Safe" version demands higher standards
    parameters: {
      // Wait for bots to fight, enter after 10 minutes
      token_age_min_minutes: 10,
      token_age_max_hours: 6,
      // Strong buy pressure
      buy_sell_ratio_1h_min: 1.8,
      tx_count_1h_min: 50,
      // Micro-cap focus with room to grow
      fdv_min: 50000,      // $50k min market cap
      fdv_max: 2000000,    // $2M max
      // Already showing momentum
      price_change_1h_min: 5,
      // Ensure exit liquidity
      liquidity_min: 10000, // $10k min
      liquidity_max: 500000,
    }
  },
  {
    id: 'launch_sniper_aggressive',
    name: 'Launch Sniper (Degen)',
    description: 'Ultra-early entries on new tokens. High risk, high reward.',
    tier: 'elite',
    strategy: 'launch_sniper',
    riskLevel: 'degen',
    holdTime: '15 min - 4 hours',
    requireRugcheck: true,
    rugcheckMinScore: 40, // Aggressive - speed matters, chonkachu had 16 and delivered 300x
    parameters: {
      // Enter earlier, more risk
      token_age_min_minutes: 5,
      token_age_max_hours: 2,
      // Lower bar for entry
      buy_sell_ratio_1h_min: 1.3,
      tx_count_1h_min: 30,
      // Even smaller caps
      fdv_min: 20000,      // $20k min
      fdv_max: 500000,     // $500k max
      // Any positive movement
      price_change_1h_min: 2,
      // Lower liquidity threshold
      liquidity_min: 5000,
      liquidity_max: 200000,
    }
  },
  
  // === MOMENTUM BREAKOUT PRESETS ===
  {
    id: 'momentum_breakout',
    name: 'Momentum Breakout',
    description: 'Catch tokens with unusual volume before they pump. Volume precedes price.',
    tier: 'pro',
    strategy: 'momentum',
    riskLevel: 'medium',
    holdTime: '2-12 hours',
    requireRugcheck: true,
    rugcheckMinScore: 30, // Moderate - standard medium-risk threshold
    requireGalaxyScore: false,
    galaxyScoreMin: 55, // Social momentum — coming soon
    parameters: {
      // Unusual volume - 3x normal
      volume_1h_vs_6h_spike: 3.0,
      // Starting to move but not already pumped
      price_change_1h_min: 5,
      price_change_1h_max: 40,
      // Buyers dominating
      buy_sell_ratio_1h_min: 1.3,
      tx_count_1h_min: 40,
      // Established enough to have data
      fdv_min: 100000,     // $100k min
      fdv_max: 10000000,   // $10M max
      // Good exit liquidity
      liquidity_min: 20000,
      volume_24h_min: 50000,
    }
  },
  {
    id: 'momentum_surge',
    name: 'Volume Surge Alert',
    description: 'Extreme volume spikes signaling potential breakout. Fast money play.',
    tier: 'elite',
    strategy: 'momentum',
    riskLevel: 'high',
    holdTime: '30 min - 6 hours',
    requireRugcheck: true,
    rugcheckMinScore: 35, // Aggressive - fast-moving opportunities
    // Galaxy Score removed - most tokens with sudden volume spikes won't have
    // LunarCrush data yet. RugCheck + volume/price filters are sufficient.
    parameters: {
      // Strong volume spike - 3x normal (was 5x, too restrictive)
      volume_1h_vs_6h_spike: 3.0,
      // Just starting to move
      price_change_1h_min: 2,
      price_change_1h_max: 40,
      // Buyers present
      buy_sell_ratio_1h_min: 1.2,
      tx_count_1h_min: 30,
      // Mid-cap focus
      fdv_min: 100000,
      fdv_max: 10000000,
      liquidity_min: 15000,
    }
  },
  
  // === HEALTHY ACCUMULATION PRESETS ===
  {
    id: 'accumulation_quiet',
    name: 'Quiet Accumulation',
    description: 'Find tokens being quietly accumulated. Stable price + decent liquidity = smart money loading.',
    tier: 'pro',
    strategy: 'accumulation',
    riskLevel: 'low',
    holdTime: '1-7 days',
    requireRugcheck: true,
    rugcheckMinScore: 15, // Conservative - longest hold, highest safety needed
    parameters: {
      // Not dumping, not pumping — sideways action
      price_change_24h_min: -15,
      price_change_24h_max: 10,
      // Survived initial volatility — at least 3 days old (4320 minutes)
      token_age_min_minutes: 4320,
      // Established project
      fdv_min: 100000,
      fdv_max: 20000000,
      // Solid liquidity
      liquidity_min: 25000,
      volume_24h_min: 10000,
    }
  },
  {
    id: 'accumulation_bounce',
    name: 'Oversold Bounce',
    description: 'Catch tokens that have bottomed and showing signs of reversal.',
    tier: 'elite',
    strategy: 'accumulation',
    riskLevel: 'medium',
    holdTime: '2-14 days',
    requireRugcheck: true,
    rugcheckMinScore: 25, // Moderate - quality oversold tokens should have decent fundamentals
    parameters: {
      // Recently dropped but stabilizing — 24h still red or flat
      price_change_24h_min: -30,
      price_change_24h_max: 5,
      // Short-term buying returning — 1h volume picking up vs 6h average
      volume_1h_vs_6h_spike: 1.3,
      // Some buying returning
      buy_sell_ratio_1h_min: 1.05,
      tx_count_24h_min: 50,
      // Established — at least 2 days old
      token_age_min_minutes: 2880,
      fdv_min: 200000,
      fdv_max: 50000000,
      liquidity_min: 30000,
    }
  },
  
  // === CEX-READY CANDIDATE ===
  {
    id: 'cex_ready_candidate',
    name: 'CEX-Ready Candidate',
    description: 'Find established tokens with exchange-worthy metrics. Strong fundamentals that could attract CEX listings.',
    tier: 'elite',
    strategy: 'cex_ready',
    riskLevel: 'medium',
    holdTime: '1-4 weeks',
    requireRugcheck: true,
    rugcheckMinScore: 20, // Conservative - institutional-grade safety for CEX listings
    requireGalaxyScore: false,
    galaxyScoreMin: 65, // Social momentum — coming soon
    parameters: {
      // Established tokens - at least 30 days old (43200 minutes)
      token_age_min_minutes: 43200,
      // Market cap sweet spot for exchange interest
      fdv_min: 1000000,      // $1M min - too small won't attract exchanges
      fdv_max: 100000000,    // $100M max - too big likely already listed
      // Strong liquidity required by exchanges
      liquidity_min: 100000,  // $100k+ liquidity
      // Consistent trading activity
      volume_24h_min: 100000, // $100k daily volume
      tx_count_24h_min: 500,  // Active community
      // Stable price action - not dumping or pumping on rumors
      price_change_24h_min: -15,
      price_change_24h_max: 30,
      // Steady volume pattern (not declining)
      volume_6h_vs_24h_spike: 0.9,
    }
  },
]

// Helper to get presets available for a subscription tier
export function getPresetsForTier(tier: 'free' | 'pro' | 'elite'): FormulaPreset[] {
  if (tier === 'free') return []
  if (tier === 'pro') return FORMULA_PRESETS.filter(p => p.tier === 'pro')
  if (tier === 'elite') return FORMULA_PRESETS // Elite gets all
  return []
}

// Helper to check if a preset is available for a tier
export function isPresetAvailable(presetId: string, tier: 'free' | 'pro' | 'elite'): boolean {
  const preset = FORMULA_PRESETS.find(p => p.id === presetId)
  if (!preset) return false
  if (tier === 'elite') return true
  if (tier === 'pro') return preset.tier === 'pro'
  return false
}

// Risk level colors for UI
export const RISK_COLORS = {
  low: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  degen: 'text-red-400 bg-red-400/10 border-red-400/20',
}

// Strategy icons/colors for UI
export const STRATEGY_COLORS: Record<string, string> = {
  launch_sniper: 'text-arena-cyan bg-arena-cyan/10 border-arena-cyan/20',
  momentum: 'text-arena-purple bg-arena-purple/10 border-arena-purple/20',
  accumulation: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  cex_ready: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

export const STRATEGY_LABELS: Record<string, string> = {
  launch_sniper: 'Launch Sniper',
  momentum: 'Momentum',
  accumulation: 'Accumulation',
  cex_ready: 'CEX Ready',
}
