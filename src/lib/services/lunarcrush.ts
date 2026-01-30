// LunarCrush API Integration
// Provides social momentum metrics via Galaxy Score

export interface GalaxyScoreData {
  symbol: string
  name: string
  galaxy_score: number // 0-100, higher = stronger social momentum
  galaxy_score_change_24h: number // Percentage change
  alt_rank: number // Ranking among all tracked assets
  social_volume: number // Number of social posts
  social_score: number // Engagement score
  social_contributors: number // Unique accounts posting
  social_dominance: number // % of crypto social conversation
  market_dominance: number // % of total crypto market cap
}

export interface LunarCrushAsset {
  id: number
  symbol: string
  name: string
  galaxy_score: number
  alt_rank: number
  social_volume: number
  social_score: number
  social_contributors: number
  social_dominance: number
  percent_change_24h?: number
}

const LUNARCRUSH_API_BASE = 'https://lunarcrush.com/api4/public'

class LunarCrushService {
  private apiKey?: string
  
  constructor() {
    this.apiKey = process.env.LUNARCRUSH_API_KEY
  }
  
  /**
   * Get Galaxy Score for a specific token by symbol
   * Note: LunarCrush uses symbols, not contract addresses
   */
  async getGalaxyScore(symbol: string): Promise<GalaxyScoreData | null> {
    try {
      // LunarCrush v4 API endpoint for coin data
      const url = `${LUNARCRUSH_API_BASE}/coins/${symbol.toUpperCase()}/v1`
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        // Try alternative endpoint for smaller tokens
        return this.getGalaxyScoreFromSearch(symbol)
      }
      
      const data = await response.json()
      
      if (!data?.data) {
        return null
      }
      
      const asset = data.data
      
      return {
        symbol: asset.symbol || symbol,
        name: asset.name || symbol,
        galaxy_score: asset.galaxy_score || 0,
        galaxy_score_change_24h: asset.percent_change_24h || 0,
        alt_rank: asset.alt_rank || 0,
        social_volume: asset.social_volume || 0,
        social_score: asset.social_score || 0,
        social_contributors: asset.social_contributors || 0,
        social_dominance: asset.social_dominance || 0,
        market_dominance: asset.market_dominance || 0,
      }
    } catch (error) {
      console.error('LunarCrush API error:', error)
      return null
    }
  }
  
  /**
   * Search for token by symbol (fallback for smaller tokens)
   */
  private async getGalaxyScoreFromSearch(symbol: string): Promise<GalaxyScoreData | null> {
    try {
      const url = `${LUNARCRUSH_API_BASE}/coins/list/v1`
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      }
      
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`
      }
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      
      // Find matching symbol
      const asset = data?.data?.find(
        (a: LunarCrushAsset) => a.symbol?.toUpperCase() === symbol.toUpperCase()
      )
      
      if (!asset) {
        return null
      }
      
      return {
        symbol: asset.symbol,
        name: asset.name,
        galaxy_score: asset.galaxy_score || 0,
        galaxy_score_change_24h: asset.percent_change_24h || 0,
        alt_rank: asset.alt_rank || 0,
        social_volume: asset.social_volume || 0,
        social_score: asset.social_score || 0,
        social_contributors: asset.social_contributors || 0,
        social_dominance: asset.social_dominance || 0,
        market_dominance: 0,
      }
    } catch (error) {
      console.error('LunarCrush search error:', error)
      return null
    }
  }
  
  /**
   * Check if a token meets the Galaxy Score threshold
   * Returns: { passed: boolean, score: number, reason?: string }
   */
  async checkSocialMomentum(
    symbol: string,
    minScore: number = 50
  ): Promise<{ passed: boolean; score: number; change24h: number; reason?: string }> {
    const data = await this.getGalaxyScore(symbol)
    
    if (!data) {
      // If LunarCrush doesn't have data for this token, pass by default
      // (Many new memecoins won't be tracked)
      return { 
        passed: true, 
        score: -1, 
        change24h: 0,
        reason: 'Token not tracked by LunarCrush (new/small token)' 
      }
    }
    
    const passed = data.galaxy_score >= minScore
    
    return {
      passed,
      score: data.galaxy_score,
      change24h: data.galaxy_score_change_24h,
      reason: passed 
        ? undefined 
        : `Galaxy Score ${data.galaxy_score} below threshold ${minScore}`,
    }
  }
  
  /**
   * Format Galaxy Score for display
   */
  formatScore(score: number): string {
    if (score < 0) return 'N/A'
    if (score >= 80) return `${score} 🚀 Exceptional`
    if (score >= 60) return `${score} 🔥 Strong`
    if (score >= 40) return `${score} ✓ Moderate`
    if (score >= 20) return `${score} ⚠️ Weak`
    return `${score} ❌ Very Low`
  }
}

// Export singleton instance
export const lunarCrushService = new LunarCrushService()
