// Wallet PnL Service
// Queries external APIs to get wallet trading performance
// Primary: Birdeye API (free tier: 30k CU/mo)
// Fallback: SolanaTracker API

export interface WalletPnLSummary {
  // Overall
  totalPnlUsd: number
  totalInvestedUsd: number
  totalSoldUsd: number
  realizedPnlUsd: number
  unrealizedPnlUsd: number
  
  // Trade counts
  totalTokensTraded: number
  totalBuyTransactions: number
  totalSellTransactions: number
  totalTransactions: number
  
  // Win/loss
  winningTokens: number
  losingTokens: number
  winRate: number
  
  // Time windows
  pnl1d: number
  pnl7d: number
  pnl30d: number
  
  // Best/worst
  bestTradeToken: string | null
  bestTradePnl: number
  worstTradeToken: string | null
  worstTradePnl: number
  
  // Meta
  dataSource: 'birdeye' | 'solanatracker'
}

// Validate Solana wallet address format (base58, 32-44 chars)
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

// ==================== BIRDEYE API ====================

interface BirdeyeTokenPnl {
  address: string
  symbol?: string
  name?: string
  realized: number
  unrealized: number
  total: number
  total_invested: number
  total_sold: number
  buy_transactions: number
  sell_transactions: number
  total_transactions: number
  current_value: number
}

interface BirdeyePnlResponse {
  success: boolean
  data?: {
    tokens?: Record<string, BirdeyeTokenPnl>
    summary?: {
      realized: number
      unrealized: number
      total: number
      totalInvested: number
      totalSold: number
      totalTokens: number
      totalBuyTransactions: number
      totalSellTransactions: number
      totalTransactions: number
      winningTokens: number
      losingTokens: number
    }
  }
}

async function fetchBirdeyePnl(walletAddress: string): Promise<WalletPnLSummary | null> {
  const apiKey = process.env.BIRDEYE_API_KEY
  if (!apiKey) {
    console.warn('BIRDEYE_API_KEY not configured')
    return null
  }

  try {
    // Try summary endpoint first (most efficient)
    const url = `https://public-api.birdeye.so/v2/wallet/pnl?wallet=${walletAddress}`
    const res = await fetch(url, {
      headers: {
        'X-API-KEY': apiKey,
        'x-chain': 'solana',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.error(`Birdeye API error: ${res.status} ${res.statusText}`)
      return null
    }

    const data = await res.json() as BirdeyePnlResponse

    if (!data.success || !data.data) {
      console.error('Birdeye returned unsuccessful response')
      return null
    }

    // Parse token-level data if no summary
    const tokens = data.data.tokens || {}
    const tokenEntries = Object.entries(tokens)

    let totalInvested = 0
    let totalSold = 0
    let realized = 0
    let unrealized = 0
    let totalBuys = 0
    let totalSells = 0
    let totalTxns = 0
    let winners = 0
    let losers = 0
    let bestPnl = -Infinity
    let worstPnl = Infinity
    let bestToken = ''
    let worstToken = ''

    for (const [addr, token] of tokenEntries) {
      totalInvested += token.total_invested || 0
      totalSold += token.total_sold || 0
      realized += token.realized || 0
      unrealized += token.unrealized || 0
      totalBuys += token.buy_transactions || 0
      totalSells += token.sell_transactions || 0
      totalTxns += token.total_transactions || 0

      const tokenTotal = token.total || (token.realized + token.unrealized)
      if (tokenTotal > 0) winners++
      else if (tokenTotal < 0) losers++

      if (tokenTotal > bestPnl) {
        bestPnl = tokenTotal
        bestToken = token.symbol || token.name || addr.slice(0, 8)
      }
      if (tokenTotal < worstPnl) {
        worstPnl = tokenTotal
        worstToken = token.symbol || token.name || addr.slice(0, 8)
      }
    }

    // Use summary if available, otherwise use calculated values
    const summary = data.data.summary
    const totalTokens = summary?.totalTokens ?? tokenEntries.length
    const winTokens = summary?.winningTokens ?? winners
    const loseTokens = summary?.losingTokens ?? losers

    return {
      totalPnlUsd: (summary?.total ?? (realized + unrealized)),
      totalInvestedUsd: summary?.totalInvested ?? totalInvested,
      totalSoldUsd: summary?.totalSold ?? totalSold,
      realizedPnlUsd: summary?.realized ?? realized,
      unrealizedPnlUsd: summary?.unrealized ?? unrealized,
      totalTokensTraded: totalTokens,
      totalBuyTransactions: summary?.totalBuyTransactions ?? totalBuys,
      totalSellTransactions: summary?.totalSellTransactions ?? totalSells,
      totalTransactions: summary?.totalTransactions ?? totalTxns,
      winningTokens: winTokens,
      losingTokens: loseTokens,
      winRate: (winTokens + loseTokens) > 0 
        ? Math.round((winTokens / (winTokens + loseTokens)) * 100) 
        : 0,
      pnl1d: 0, // Birdeye doesn't return windowed PnL in this endpoint
      pnl7d: 0,
      pnl30d: 0,
      bestTradeToken: bestPnl > -Infinity ? bestToken : null,
      bestTradePnl: bestPnl > -Infinity ? bestPnl : 0,
      worstTradeToken: worstPnl < Infinity ? worstToken : null,
      worstTradePnl: worstPnl < Infinity ? worstPnl : 0,
      dataSource: 'birdeye',
    }
  } catch (err) {
    console.error('Birdeye fetch error:', err)
    return null
  }
}

// ==================== SOLANA TRACKER API ====================

interface SolanaTrackerPnlResponse {
  tokens?: Record<string, {
    holding: number
    held: number
    sold: number
    sold_usd: number
    realized: number
    unrealized: number
    total: number
    total_sold: number
    total_invested: number
    average_buy_amount: number
    current_value: number
    cost_basis: number
    first_buy_time: number
    last_buy_time: number
    last_sell_time: number
    last_trade_time: number
    buy_transactions: number
    sell_transactions: number
    total_transactions: number
  }>
  summary?: {
    realized: number
    unrealized: number
    total: number
    totalInvested: number
    totalSold: number
    totalTokens: number
    totalBuyTransactions: number
    totalSellTransactions: number
    totalTransactions: number
    winningTokens: number
    losingTokens: number
  }
}

async function fetchSolanaTrackerPnl(walletAddress: string): Promise<WalletPnLSummary | null> {
  const apiKey = process.env.SOLANA_TRACKER_API_KEY
  if (!apiKey) {
    console.warn('SOLANA_TRACKER_API_KEY not configured')
    return null
  }

  try {
    const url = `https://data.solanatracker.io/pnl/${walletAddress}?showHistoricPnL=true`
    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.error(`SolanaTracker API error: ${res.status}`)
      return null
    }

    const data = await res.json() as SolanaTrackerPnlResponse

    const tokens = data.tokens || {}
    const tokenEntries = Object.entries(tokens)

    if (tokenEntries.length === 0) {
      return null
    }

    let totalInvested = 0
    let totalSold = 0
    let realized = 0
    let unrealized = 0
    let totalBuys = 0
    let totalSells = 0
    let totalTxns = 0
    let winners = 0
    let losers = 0
    let bestPnl = -Infinity
    let worstPnl = Infinity
    let bestToken = ''
    let worstToken = ''

    for (const [addr, token] of tokenEntries) {
      totalInvested += token.total_invested || 0
      totalSold += token.total_sold || 0
      realized += token.realized || 0
      unrealized += token.unrealized || 0
      totalBuys += token.buy_transactions || 0
      totalSells += token.sell_transactions || 0
      totalTxns += token.total_transactions || 0

      if (token.total > 0) winners++
      else if (token.total < 0) losers++

      if (token.total > bestPnl) {
        bestPnl = token.total
        bestToken = addr.slice(0, 8)
      }
      if (token.total < worstPnl) {
        worstPnl = token.total
        worstToken = addr.slice(0, 8)
      }
    }

    const summary = data.summary

    return {
      totalPnlUsd: summary?.total ?? (realized + unrealized),
      totalInvestedUsd: summary?.totalInvested ?? totalInvested,
      totalSoldUsd: summary?.totalSold ?? totalSold,
      realizedPnlUsd: summary?.realized ?? realized,
      unrealizedPnlUsd: summary?.unrealized ?? unrealized,
      totalTokensTraded: summary?.totalTokens ?? tokenEntries.length,
      totalBuyTransactions: summary?.totalBuyTransactions ?? totalBuys,
      totalSellTransactions: summary?.totalSellTransactions ?? totalSells,
      totalTransactions: summary?.totalTransactions ?? totalTxns,
      winningTokens: summary?.winningTokens ?? winners,
      losingTokens: summary?.losingTokens ?? losers,
      winRate: ((summary?.winningTokens ?? winners) + (summary?.losingTokens ?? losers)) > 0
        ? Math.round(((summary?.winningTokens ?? winners) / ((summary?.winningTokens ?? winners) + (summary?.losingTokens ?? losers))) * 100)
        : 0,
      pnl1d: 0,
      pnl7d: 0,
      pnl30d: 0,
      bestTradeToken: bestPnl > -Infinity ? bestToken : null,
      bestTradePnl: bestPnl > -Infinity ? bestPnl : 0,
      worstTradeToken: worstPnl < Infinity ? worstToken : null,
      worstTradePnl: worstPnl < Infinity ? worstPnl : 0,
      dataSource: 'solanatracker',
    }
  } catch (err) {
    console.error('SolanaTracker fetch error:', err)
    return null
  }
}

// ==================== MAIN FUNCTION ====================

/**
 * Fetch wallet PnL from the best available API
 * Tries Birdeye first, falls back to SolanaTracker
 */
export async function fetchWalletPnl(walletAddress: string): Promise<WalletPnLSummary | null> {
  if (!isValidSolanaAddress(walletAddress)) {
    console.error('Invalid Solana address:', walletAddress)
    return null
  }

  // Try Birdeye first (better free tier)
  const birdeyeResult = await fetchBirdeyePnl(walletAddress)
  if (birdeyeResult) return birdeyeResult

  // Fallback to SolanaTracker
  const trackerResult = await fetchSolanaTrackerPnl(walletAddress)
  if (trackerResult) return trackerResult

  console.error('All PnL API providers failed for wallet:', walletAddress)
  return null
}

// Verification criteria: enough trading history to be "verified"
export const VERIFICATION_CRITERIA = {
  minTotalTransactions: 10,  // At least 10 trades
  minTokensTraded: 3,        // Traded at least 3 different tokens
  minDaysActive: 7,          // Account needs to exist 7+ days (checked separately)
}

export function meetsVerificationCriteria(stats: WalletPnLSummary): boolean {
  return (
    stats.totalTransactions >= VERIFICATION_CRITERIA.minTotalTransactions &&
    stats.totalTokensTraded >= VERIFICATION_CRITERIA.minTokensTraded
  )
}
