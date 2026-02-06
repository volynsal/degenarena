import type { DexScreenerToken } from '@/types/database'

const DEXSCREENER_API_BASE = 'https://api.dexscreener.com/latest'

export interface DexScreenerPair {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity?: {
    usd: number
    base: number
    quote: number
  }
  fdv?: number
  pairCreatedAt?: number
  info?: {
    imageUrl?: string
    websites?: { url: string }[]
    socials?: { type: string; url: string }[]
  }
}

export interface DexScreenerResponse {
  schemaVersion: string
  pairs: DexScreenerPair[] | null
}

export class DexScreenerService {
  private apiKey?: string
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey
  }
  
  private async fetch(endpoint: string): Promise<DexScreenerResponse> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    
    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey
    }
    
    const response = await fetch(`${DEXSCREENER_API_BASE}${endpoint}`, {
      headers,
      next: { revalidate: 30 }, // Cache for 30 seconds
    })
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * Get newly created pairs on Solana
   * Returns pairs sorted by creation time (newest first)
   */
  async getNewTokens(chain: string = 'solana'): Promise<DexScreenerPair[]> {
    // Get token profiles which includes new launches
    const response = await this.fetch(`/dex/tokens/${chain}`)
    return response.pairs || []
  }
  
  /**
   * Search for tokens by address
   */
  async getTokenByAddress(address: string): Promise<DexScreenerPair | null> {
    const response = await this.fetch(`/dex/tokens/${address}`)
    return response.pairs?.[0] || null
  }
  
  /**
   * Get pairs for a specific token
   */
  async getPairsByToken(tokenAddress: string): Promise<DexScreenerPair[]> {
    const response = await this.fetch(`/dex/tokens/${tokenAddress}`)
    return response.pairs || []
  }
  
  /**
   * Get latest boosted tokens (trending/promoted)
   */
  async getBoostedTokens(): Promise<DexScreenerPair[]> {
    try {
      const response = await fetch('https://api.dexscreener.com/token-boosts/latest/v1', {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      })
      
      if (!response.ok) return []
      
      const data = await response.json()
      return data || []
    } catch {
      return []
    }
  }
  
  /**
   * Search for pairs by query
   */
  async searchPairs(query: string): Promise<DexScreenerPair[]> {
    const response = await this.fetch(`/dex/search?q=${encodeURIComponent(query)}`)
    return response.pairs || []
  }
  
  /**
   * Get pairs on a specific chain, sorted by various metrics
   * Uses boosted tokens as source since search API is unreliable
   */
  async getPairsByChain(
    chain: string,
    sortBy: 'volume' | 'liquidity' | 'txns' = 'volume'
  ): Promise<DexScreenerPair[]> {
    const pairs: DexScreenerPair[] = []
    
    try {
      // Get boosted/trending tokens first
      const boostResponse = await fetch('https://api.dexscreener.com/token-boosts/latest/v1', {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 60 },
      })
      
      if (boostResponse.ok) {
        const boostedTokens = await boostResponse.json()
        
        // Filter to requested chain and get unique token addresses
        const chainTokens = boostedTokens
          .filter((t: { chainId: string }) => t.chainId === chain)
          .slice(0, 30) // Limit to keep within cron timeout
        
        // Fetch full pair data for each token (in batches)
        const tokenAddresses = Array.from(new Set(chainTokens.map((t: { tokenAddress: string }) => t.tokenAddress))) as string[]
        
        // Batch fetch - DexScreener allows comma-separated addresses (up to 30)
        for (let i = 0; i < tokenAddresses.length; i += 15) {
          const batch = tokenAddresses.slice(i, i + 15)
          const batchAddresses = batch.join(',')
          
          try {
            const pairResponse = await this.fetch(`/dex/tokens/${batchAddresses}`)
            if (pairResponse.pairs) {
              pairs.push(...pairResponse.pairs)
            }
          } catch (e) {
            console.error('Error fetching batch:', e)
          }
        }
      }
    } catch (e) {
      console.error('Error in getPairsByChain:', e)
    }
    
    // Sort locally based on preference
    return pairs.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
        case 'liquidity':
          return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        case 'txns':
          return (b.txns?.h24?.buys || 0) + (b.txns?.h24?.sells || 0) - 
                 (a.txns?.h24?.buys || 0) - (a.txns?.h24?.sells || 0)
        default:
          return 0
      }
    })
  }
  
  /**
   * Check if a token meets the criteria of a formula
   */
  checkFormulaMatch(
    pair: DexScreenerPair,
    formula: {
      // Basic parameters
      liquidity_min?: number | null
      liquidity_max?: number | null
      volume_24h_min?: number | null
      volume_24h_spike?: number | null
      holders_min?: number | null
      holders_max?: number | null
      token_age_max_hours?: number | null
      require_verified_contract?: boolean
      require_liquidity_lock?: boolean
      // Enhanced parameters
      token_age_min_minutes?: number | null
      buy_sell_ratio_1h_min?: number | null
      tx_count_1h_min?: number | null
      tx_count_24h_min?: number | null
      fdv_min?: number | null
      fdv_max?: number | null
      price_change_1h_min?: number | null
      price_change_1h_max?: number | null
      price_change_6h_min?: number | null
      price_change_6h_max?: number | null
      price_change_24h_min?: number | null
      price_change_24h_max?: number | null
      volume_1h_vs_6h_spike?: number | null
      volume_6h_vs_24h_spike?: number | null
    }
  ): { matches: boolean; reasons: string[] } {
    const reasons: string[] = []
    let matches = true
    
    // === BASIC FILTERS ===
    
    // Check liquidity
    const liquidity = pair.liquidity?.usd || 0
    if (formula.liquidity_min && liquidity < formula.liquidity_min) {
      matches = false
      reasons.push(`Liquidity ($${liquidity.toLocaleString()}) below minimum ($${formula.liquidity_min.toLocaleString()})`)
    }
    if (formula.liquidity_max && liquidity > formula.liquidity_max) {
      matches = false
      reasons.push(`Liquidity ($${liquidity.toLocaleString()}) above maximum ($${formula.liquidity_max.toLocaleString()})`)
    }
    
    // Check 24h volume
    const volume24h = pair.volume?.h24 || 0
    if (formula.volume_24h_min && volume24h < formula.volume_24h_min) {
      matches = false
      reasons.push(`24h Volume ($${volume24h.toLocaleString()}) below minimum ($${formula.volume_24h_min.toLocaleString()})`)
    }
    
    // Check volume spike (compare h1 to average)
    if (formula.volume_24h_spike) {
      const hourlyVolume = pair.volume?.h1 || 0
      const avgHourlyVolume = volume24h / 24
      const spikePercent = avgHourlyVolume > 0 ? ((hourlyVolume / avgHourlyVolume) - 1) * 100 : 0
      
      if (spikePercent < formula.volume_24h_spike) {
        matches = false
        reasons.push(`Volume spike (${spikePercent.toFixed(0)}%) below threshold (${formula.volume_24h_spike}%)`)
      }
    }
    
    // Check token age (maximum)
    const ageMs = pair.pairCreatedAt ? Date.now() - pair.pairCreatedAt : null
    const ageHours = ageMs ? ageMs / (1000 * 60 * 60) : null
    const ageMinutes = ageMs ? ageMs / (1000 * 60) : null
    
    if (formula.token_age_max_hours && ageHours !== null) {
      if (ageHours > formula.token_age_max_hours) {
        matches = false
        reasons.push(`Token age (${ageHours.toFixed(1)}h) exceeds maximum (${formula.token_age_max_hours}h)`)
      }
    }
    
    // === ENHANCED FILTERS ===
    
    // Check token age (minimum) - Launch Sniper
    if (formula.token_age_min_minutes && ageMinutes !== null) {
      if (ageMinutes < formula.token_age_min_minutes) {
        matches = false
        reasons.push(`Token age (${ageMinutes.toFixed(0)}m) below minimum (${formula.token_age_min_minutes}m)`)
      }
    }
    
    // Check buy/sell ratio - Launch Sniper, Momentum
    if (formula.buy_sell_ratio_1h_min) {
      const buys = pair.txns?.h1?.buys || 0
      const sells = pair.txns?.h1?.sells || 1 // Avoid division by zero
      const ratio = buys / sells
      if (ratio < formula.buy_sell_ratio_1h_min) {
        matches = false
        reasons.push(`Buy/sell ratio (${ratio.toFixed(2)}) below minimum (${formula.buy_sell_ratio_1h_min})`)
      }
    }
    
    // Check transaction count 1h - Launch Sniper, Momentum
    if (formula.tx_count_1h_min) {
      const txCount = (pair.txns?.h1?.buys || 0) + (pair.txns?.h1?.sells || 0)
      if (txCount < formula.tx_count_1h_min) {
        matches = false
        reasons.push(`1h transactions (${txCount}) below minimum (${formula.tx_count_1h_min})`)
      }
    }
    
    // Check transaction count 24h
    if (formula.tx_count_24h_min) {
      const txCount = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0)
      if (txCount < formula.tx_count_24h_min) {
        matches = false
        reasons.push(`24h transactions (${txCount}) below minimum (${formula.tx_count_24h_min})`)
      }
    }
    
    // Check FDV (market cap) - All strategies
    const fdv = pair.fdv || 0
    if (formula.fdv_min && fdv < formula.fdv_min) {
      matches = false
      reasons.push(`Market cap ($${fdv.toLocaleString()}) below minimum ($${formula.fdv_min.toLocaleString()})`)
    }
    if (formula.fdv_max && fdv > formula.fdv_max) {
      matches = false
      reasons.push(`Market cap ($${fdv.toLocaleString()}) above maximum ($${formula.fdv_max.toLocaleString()})`)
    }
    
    // Check price change 1h - Launch Sniper, Momentum
    const priceChange1h = pair.priceChange?.h1 || 0
    if (formula.price_change_1h_min !== null && formula.price_change_1h_min !== undefined) {
      if (priceChange1h < formula.price_change_1h_min) {
        matches = false
        reasons.push(`1h price change (${priceChange1h.toFixed(1)}%) below minimum (${formula.price_change_1h_min}%)`)
      }
    }
    if (formula.price_change_1h_max !== null && formula.price_change_1h_max !== undefined) {
      if (priceChange1h > formula.price_change_1h_max) {
        matches = false
        reasons.push(`1h price change (${priceChange1h.toFixed(1)}%) above maximum (${formula.price_change_1h_max}%)`)
      }
    }
    
    // Check price change 6h
    const priceChange6h = pair.priceChange?.h6 || 0
    if (formula.price_change_6h_min !== null && formula.price_change_6h_min !== undefined) {
      if (priceChange6h < formula.price_change_6h_min) {
        matches = false
        reasons.push(`6h price change (${priceChange6h.toFixed(1)}%) below minimum (${formula.price_change_6h_min}%)`)
      }
    }
    if (formula.price_change_6h_max !== null && formula.price_change_6h_max !== undefined) {
      if (priceChange6h > formula.price_change_6h_max) {
        matches = false
        reasons.push(`6h price change (${priceChange6h.toFixed(1)}%) above maximum (${formula.price_change_6h_max}%)`)
      }
    }
    
    // Check price change 24h - Healthy Accumulation
    const priceChange24h = pair.priceChange?.h24 || 0
    if (formula.price_change_24h_min !== null && formula.price_change_24h_min !== undefined) {
      if (priceChange24h < formula.price_change_24h_min) {
        matches = false
        reasons.push(`24h price change (${priceChange24h.toFixed(1)}%) below minimum (${formula.price_change_24h_min}%)`)
      }
    }
    if (formula.price_change_24h_max !== null && formula.price_change_24h_max !== undefined) {
      if (priceChange24h > formula.price_change_24h_max) {
        matches = false
        reasons.push(`24h price change (${priceChange24h.toFixed(1)}%) above maximum (${formula.price_change_24h_max}%)`)
      }
    }
    
    // Check volume spike 1h vs 6h - Momentum Breakout
    if (formula.volume_1h_vs_6h_spike) {
      const volume1h = pair.volume?.h1 || 0
      const volume6h = pair.volume?.h6 || 1
      const avgVolume1hFrom6h = volume6h / 6
      const spike = avgVolume1hFrom6h > 0 ? volume1h / avgVolume1hFrom6h : 0
      if (spike < formula.volume_1h_vs_6h_spike) {
        matches = false
        reasons.push(`Volume spike 1h/6h (${spike.toFixed(1)}x) below minimum (${formula.volume_1h_vs_6h_spike}x)`)
      }
    }
    
    // Check volume spike 6h vs 24h - Healthy Accumulation (inverse - looking for decreasing)
    if (formula.volume_6h_vs_24h_spike) {
      const volume6h = pair.volume?.h6 || 0
      const volume24h = pair.volume?.h24 || 1
      const avgVolume6hFrom24h = volume24h / 4
      const spike = avgVolume6hFrom24h > 0 ? volume6h / avgVolume6hFrom24h : 0
      // For accumulation, we want LOWER volume ratio (quiet period)
      if (spike > formula.volume_6h_vs_24h_spike) {
        matches = false
        reasons.push(`Volume ratio 6h/24h (${spike.toFixed(1)}x) above maximum (${formula.volume_6h_vs_24h_spike}x)`)
      }
    }
    
    // Note: Holders count is not available from DexScreener
    // This would need to be fetched from chain-specific APIs
    
    // Note: Contract verification and liquidity lock require additional API calls
    // For MVP, we'll skip these or add them later
    
    if (matches) {
      reasons.push('All criteria matched')
    }
    
    return { matches, reasons }
  }
  
  /**
   * Convert DexScreener pair to our TokenMatch format
   */
  pairToTokenMatch(
    pair: DexScreenerPair,
    formulaId: string
  ): {
    formula_id: string
    token_address: string
    token_name: string
    token_symbol: string
    chain: 'solana' | 'ethereum' | 'base'
    price_at_match: number
    liquidity: number
    volume_24h: number
    market_cap: number | null
    dexscreener_url: string
    contract_verified: boolean
  } {
    return {
      formula_id: formulaId,
      token_address: pair.baseToken.address,
      token_name: pair.baseToken.name,
      token_symbol: pair.baseToken.symbol,
      chain: (pair.chainId === 'solana' ? 'solana' : 
              pair.chainId === 'ethereum' ? 'ethereum' : 
              pair.chainId === 'base' ? 'base' : 'solana') as 'solana' | 'ethereum' | 'base',
      price_at_match: parseFloat(pair.priceUsd) || 0,
      liquidity: pair.liquidity?.usd || 0,
      volume_24h: pair.volume?.h24 || 0,
      market_cap: pair.fdv || null,
      dexscreener_url: pair.url,
      contract_verified: false, // Would need separate verification
    }
  }
}

// Singleton instance
export const dexscreener = new DexScreenerService(
  process.env.DEXSCREENER_API_KEY
)
