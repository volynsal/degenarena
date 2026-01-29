// RugCheck.xyz API Integration
// Provides token safety analysis for Solana memecoins

export interface RugCheckReport {
  tokenAddress: string
  score: number // 0-100, higher = safer
  risks: RugCheckRisk[]
  isGood: boolean // Overall safe verdict
  tokenMeta?: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface RugCheckRisk {
  name: string
  description: string
  level: 'info' | 'warn' | 'danger'
  score: number
}

export interface RugCheckSummary {
  mint: string
  score: number
  risks: Array<{
    name: string
    level: string
    description: string
    score: number
  }>
}

const RUGCHECK_API_BASE = 'https://api.rugcheck.xyz/v1'

// Risk thresholds
export const RISK_THRESHOLDS = {
  SAFE: 80,      // Score >= 80 = Good
  CAUTION: 50,   // Score 50-79 = Caution
  DANGER: 0,     // Score < 50 = Danger
}

class RugCheckService {
  private apiKey?: string
  
  constructor() {
    this.apiKey = process.env.RUGCHECK_API_KEY
  }
  
  /**
   * Get a quick summary report for a token
   * This is the lightweight endpoint - use for filtering
   */
  async getTokenSummary(tokenAddress: string): Promise<RugCheckSummary | null> {
    try {
      const response = await fetch(
        `${RUGCHECK_API_BASE}/tokens/${tokenAddress}/report/summary`,
        {
          headers: this.apiKey ? { 'X-API-KEY': this.apiKey } : {},
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      )
      
      if (!response.ok) {
        console.warn(`RugCheck API error for ${tokenAddress}:`, response.status)
        return null
      }
      
      const data = await response.json()
      return data as RugCheckSummary
    } catch (error) {
      console.error('RugCheck API error:', error)
      return null
    }
  }
  
  /**
   * Get full detailed report for a token
   * Use sparingly - more API-intensive
   */
  async getTokenReport(tokenAddress: string): Promise<RugCheckReport | null> {
    try {
      const response = await fetch(
        `${RUGCHECK_API_BASE}/tokens/${tokenAddress}/report`,
        {
          headers: this.apiKey ? { 'X-API-KEY': this.apiKey } : {},
          next: { revalidate: 300 },
        }
      )
      
      if (!response.ok) {
        console.warn(`RugCheck API error for ${tokenAddress}:`, response.status)
        return null
      }
      
      const data = await response.json()
      
      // Transform to our interface
      return {
        tokenAddress,
        score: data.score || 0,
        risks: (data.risks || []).map((r: any) => ({
          name: r.name,
          description: r.description,
          level: this.mapRiskLevel(r.level),
          score: r.score || 0,
        })),
        isGood: (data.score || 0) >= RISK_THRESHOLDS.SAFE,
        tokenMeta: data.tokenMeta,
      }
    } catch (error) {
      console.error('RugCheck API error:', error)
      return null
    }
  }
  
  /**
   * Quick check if a token passes safety threshold
   * Returns: { passed: boolean, score: number, reason?: string }
   */
  async checkTokenSafety(
    tokenAddress: string, 
    minScore: number = RISK_THRESHOLDS.CAUTION
  ): Promise<{ passed: boolean; score: number; reason?: string; risks?: string[] }> {
    const summary = await this.getTokenSummary(tokenAddress)
    
    if (!summary) {
      // If RugCheck is unavailable, pass by default (don't block on API failure)
      return { passed: true, score: -1, reason: 'RugCheck unavailable' }
    }
    
    const passed = summary.score >= minScore
    const dangerRisks = summary.risks
      ?.filter(r => r.level === 'danger' || r.level === 'error')
      ?.map(r => r.name) || []
    
    return {
      passed,
      score: summary.score,
      reason: passed 
        ? undefined 
        : `RugCheck score ${summary.score} below threshold ${minScore}`,
      risks: dangerRisks.length > 0 ? dangerRisks : undefined,
    }
  }
  
  /**
   * Format risk score for display
   */
  formatScore(score: number): { label: string; color: string; emoji: string } {
    if (score >= RISK_THRESHOLDS.SAFE) {
      return { label: 'Good', color: 'text-green-400', emoji: '✅' }
    } else if (score >= RISK_THRESHOLDS.CAUTION) {
      return { label: 'Caution', color: 'text-yellow-400', emoji: '⚠️' }
    } else {
      return { label: 'Danger', color: 'text-red-400', emoji: '🚨' }
    }
  }
  
  private mapRiskLevel(level: string): 'info' | 'warn' | 'danger' {
    switch (level?.toLowerCase()) {
      case 'error':
      case 'danger':
        return 'danger'
      case 'warn':
      case 'warning':
        return 'warn'
      default:
        return 'info'
    }
  }
}

// Export singleton instance
export const rugCheckService = new RugCheckService()
