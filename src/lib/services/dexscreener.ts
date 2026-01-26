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
   */
  async getPairsByChain(
    chain: string,
    sortBy: 'volume' | 'liquidity' | 'txns' = 'volume'
  ): Promise<DexScreenerPair[]> {
    // DexScreener's search endpoint with chain filter
    const response = await this.fetch(`/dex/search?q=chain:${chain}`)
    
    const pairs = response.pairs || []
    
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
      liquidity_min?: number | null
      liquidity_max?: number | null
      volume_24h_min?: number | null
      volume_24h_spike?: number | null
      holders_min?: number | null
      holders_max?: number | null
      token_age_max_hours?: number | null
      require_verified_contract?: boolean
      require_liquidity_lock?: boolean
    }
  ): { matches: boolean; reasons: string[] } {
    const reasons: string[] = []
    let matches = true
    
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
    const volume = pair.volume?.h24 || 0
    if (formula.volume_24h_min && volume < formula.volume_24h_min) {
      matches = false
      reasons.push(`24h Volume ($${volume.toLocaleString()}) below minimum ($${formula.volume_24h_min.toLocaleString()})`)
    }
    
    // Check volume spike (compare h1 to average)
    if (formula.volume_24h_spike) {
      const hourlyVolume = pair.volume?.h1 || 0
      const avgHourlyVolume = volume / 24
      const spikePercent = avgHourlyVolume > 0 ? ((hourlyVolume / avgHourlyVolume) - 1) * 100 : 0
      
      if (spikePercent < formula.volume_24h_spike) {
        matches = false
        reasons.push(`Volume spike (${spikePercent.toFixed(0)}%) below threshold (${formula.volume_24h_spike}%)`)
      }
    }
    
    // Check token age
    if (formula.token_age_max_hours && pair.pairCreatedAt) {
      const ageHours = (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60)
      if (ageHours > formula.token_age_max_hours) {
        matches = false
        reasons.push(`Token age (${ageHours.toFixed(1)}h) exceeds maximum (${formula.token_age_max_hours}h)`)
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
