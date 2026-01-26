import { createClient } from '@supabase/supabase-js'
import { DexScreenerService, type DexScreenerPair } from './dexscreener'
import { alertService, type AlertPayload } from './alerts'
import type { Formula } from '@/types/database'

// Service role client for server-side operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const dexscreener = new DexScreenerService(process.env.DEXSCREENER_API_KEY)

export interface MonitoringResult {
  formulaId: string
  formulaName: string
  matchedTokens: {
    pair: DexScreenerPair
    reasons: string[]
  }[]
}

export class TokenMonitorService {
  private processedTokens: Set<string> = new Set()
  private lastCheckTime: number = Date.now()
  
  /**
   * Get all active formulas from the database
   */
  async getActiveFormulas(): Promise<Formula[]> {
    const { data, error } = await supabaseAdmin
      .from('formulas')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching active formulas:', error)
      return []
    }
    
    return data as Formula[]
  }
  
  /**
   * Check if a token has already been matched for a formula
   */
  async isAlreadyMatched(formulaId: string, tokenAddress: string): Promise<boolean> {
    const { data } = await supabaseAdmin
      .from('token_matches')
      .select('id')
      .eq('formula_id', formulaId)
      .eq('token_address', tokenAddress)
      .single()
    
    return !!data
  }
  
  /**
   * Save a new token match to the database
   * @param sendImmediateAlert - If true, sends alert immediately. If false, waits for digest cron.
   */
  async saveMatch(
    pair: DexScreenerPair,
    formula: Formula,
    reasons: string[],
    sendImmediateAlert: boolean = false
  ): Promise<string | null> {
    const matchData = dexscreener.pairToTokenMatch(pair, formula.id)
    
    const { data, error } = await supabaseAdmin
      .from('token_matches')
      .insert(matchData)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving match:', error)
      return null
    }
    
    console.log(`✅ New match: ${pair.baseToken.symbol} for formula "${formula.name}"`)
    console.log(`   Reasons: ${reasons.join(', ')}`)
    
    // Send immediate alert only if requested (e.g., on formula activation)
    if (sendImmediateAlert) {
      try {
        const alertPayload: AlertPayload = {
          userId: formula.user_id,
          formulaId: formula.id,
          formulaName: formula.name,
          matchId: data.id,
          tokenSymbol: pair.baseToken.symbol,
          tokenName: pair.baseToken.name,
          tokenAddress: pair.baseToken.address,
          chain: pair.chainId || 'solana',
          price: parseFloat(pair.priceUsd || '0'),
          liquidity: pair.liquidity?.usd || 0,
          volume24h: pair.volume?.h24 || 0,
          dexscreenerUrl: pair.url || '',
        }
        
        const alertResults = await alertService.sendMatchAlerts(alertPayload)
        console.log(`📨 Immediate alert sent for ${pair.baseToken.symbol}:`, alertResults)
      } catch (alertError) {
        console.error('Error sending immediate alert:', alertError)
        // Don't fail the match save if alert fails
      }
    }
    
    return data.id
  }
  
  /**
   * Run a single monitoring cycle
   */
  async runMonitoringCycle(): Promise<MonitoringResult[]> {
    console.log('🔍 Starting monitoring cycle...')
    const results: MonitoringResult[] = []
    
    // Get all active formulas
    const formulas = await this.getActiveFormulas()
    console.log(`📋 Found ${formulas.length} active formulas`)
    
    if (formulas.length === 0) {
      return results
    }
    
    // Get new/recent tokens from DexScreener
    // We'll check Solana for MVP, can add other chains later
    const chains = ['solana']
    
    for (const chain of chains) {
      try {
        // Get pairs sorted by recent activity
        const pairs = await dexscreener.getPairsByChain(chain, 'volume')
        console.log(`🔗 Fetched ${pairs.length} pairs from ${chain}`)
        
        // Filter to only new tokens (created in last 24h for now)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
        const newPairs = pairs.filter(p => {
          if (!p.pairCreatedAt) return false
          return p.pairCreatedAt > oneDayAgo
        })
        
        console.log(`🆕 ${newPairs.length} pairs created in last 24h`)
        
        // Check each formula against each new token
        for (const formula of formulas) {
          const matchedTokens: { pair: DexScreenerPair; reasons: string[] }[] = []
          
          for (const pair of newPairs) {
            // Skip if already processed this token for this formula
            const cacheKey = `${formula.id}:${pair.baseToken.address}`
            if (this.processedTokens.has(cacheKey)) {
              continue
            }
            
            // Check if already in database
            const alreadyMatched = await this.isAlreadyMatched(
              formula.id, 
              pair.baseToken.address
            )
            
            if (alreadyMatched) {
              this.processedTokens.add(cacheKey)
              continue
            }
            
            // Check if token matches formula criteria
            const { matches, reasons } = dexscreener.checkFormulaMatch(pair, formula)
            
            if (matches) {
              // Save the match
              await this.saveMatch(pair, formula, reasons)
              matchedTokens.push({ pair, reasons })
              
              // Mark as processed
              this.processedTokens.add(cacheKey)
            }
          }
          
          if (matchedTokens.length > 0) {
            results.push({
              formulaId: formula.id,
              formulaName: formula.name,
              matchedTokens,
            })
          }
        }
      } catch (error) {
        console.error(`Error processing chain ${chain}:`, error)
      }
    }
    
    // Clean up old processed tokens periodically (keep last 1000)
    if (this.processedTokens.size > 1000) {
      const entries = Array.from(this.processedTokens)
      this.processedTokens = new Set(entries.slice(-500))
    }
    
    this.lastCheckTime = Date.now()
    console.log(`✅ Monitoring cycle complete. ${results.length} formulas had matches.`)
    
    return results
  }
  
  /**
   * Get token price for return calculation
   */
  async getTokenPrice(tokenAddress: string): Promise<number | null> {
    try {
      const pair = await dexscreener.getTokenByAddress(tokenAddress)
      if (pair) {
        return parseFloat(pair.priceUsd) || null
      }
    } catch (error) {
      console.error('Error fetching token price:', error)
    }
    return null
  }
  
  /**
   * Update returns for a match
   */
  async updateMatchReturns(
    matchId: string,
    currentPrice: number,
    priceAtMatch: number,
    timeframe: '1h' | '24h' | '7d'
  ): Promise<void> {
    const returnPercent = ((currentPrice - priceAtMatch) / priceAtMatch) * 100
    
    const updateData: Record<string, number | boolean> = {}
    
    switch (timeframe) {
      case '1h':
        updateData.price_1h = currentPrice
        updateData.return_1h = returnPercent
        break
      case '24h':
        updateData.price_24h = currentPrice
        updateData.return_24h = returnPercent
        updateData.is_win = returnPercent > 0
        break
      case '7d':
        updateData.price_7d = currentPrice
        updateData.return_7d = returnPercent
        break
    }
    
    const { error } = await supabaseAdmin
      .from('token_matches')
      .update(updateData)
      .eq('id', matchId)
    
    if (error) {
      console.error('Error updating match returns:', error)
    }
  }
}

// Singleton instance
export const tokenMonitor = new TokenMonitorService()
