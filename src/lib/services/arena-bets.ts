import { createClient } from '@supabase/supabase-js'
import { DexScreenerService, type DexScreenerPair } from './dexscreener'
import type { ArenaMarket, MarketType } from '@/types/database'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// =============================================
// MARKET TEMPLATES
// =============================================

interface MarketTemplate {
  type: MarketType
  question: (symbol: string, target: string) => string
  description: (symbol: string, target: string, timeframe: string) => string
  timeframeMinutes: number
}

const MARKET_TEMPLATES: MarketTemplate[] = [
  // Quick flip markets (15 min)
  {
    type: 'up_down',
    question: (s) => `Will $${s} pump 10%+ in the next 15 minutes?`,
    description: (s, _, tf) => `Predict whether $${s} will gain at least 10% from its current price within ${tf}.`,
    timeframeMinutes: 15,
  },
  // Standard markets (1 hour)
  {
    type: 'up_down',
    question: (s) => `Will $${s} be higher in 1 hour?`,
    description: (s, _, tf) => `Predict whether $${s} will close above its current price after ${tf}.`,
    timeframeMinutes: 60,
  },
  // Moonshot markets (4 hours)
  {
    type: 'moonshot',
    question: (s) => `Will $${s} 2x in the next 4 hours?`,
    description: (s, _, tf) => `Predict whether $${s} will double from its current price within ${tf}. Moonshot territory.`,
    timeframeMinutes: 240,
  },
  // Rug call markets (1 hour)
  {
    type: 'rug_call',
    question: (s) => `Will $${s} rug in the next hour?`,
    description: (s, _, tf) => `Predict whether $${s} will lose 80%+ of its value within ${tf}. Trust your instincts.`,
    timeframeMinutes: 60,
  },
]

// =============================================
// MARKET GENERATION FILTERS (3-layer)
// =============================================

// Layer 1 — PRIMARY: Social signal (GalaxyScore from LunarCrush)
// High GalaxyScore = people are talking about it = worth creating a market for
const PRIMARY_GALAXY_SCORE_MIN = 50

// Layer 2 — SECONDARY: On-chain safety floor (DexScreener data)
// Prevents markets on socially buzzy tokens with no real trading activity
const SECONDARY_FILTER = {
  minLiquidityUsd: 5000,  // $5K+ liquidity — can't be easily manipulated
  minTx1h: 20,            // At least 20 txs in the last hour — real activity
}

// Layer 3 — TERTIARY: Momentum / volatility (makes the market interesting to bet on)
// At least one of these must be true — ensures the token isn't flat-lining
const TERTIARY_FILTER = {
  minPriceChangeAbsolute1h: 3, // 3%+ swing in either direction
  minVolumeSpike1hVs6h: 1.5,  // 1h vol is 1.5x the 6h average
  minBuySellRatio: 1.3,       // Buy pressure: buys > 1.3x sells (or inverse)
}

interface FilterResult {
  passes: boolean
  reason?: string
}

function passesFilter(pair: DexScreenerPair, galaxyScore: number | null): FilterResult {
  // Layer 1: GalaxyScore gate
  const gs = galaxyScore ?? 0
  if (gs < PRIMARY_GALAXY_SCORE_MIN) {
    return { passes: false, reason: `GalaxyScore ${gs} < ${PRIMARY_GALAXY_SCORE_MIN}` }
  }

  // Layer 2: On-chain safety
  const liq = pair.liquidity?.usd ?? 0
  const tx1h = (pair.txns?.h1?.buys ?? 0) + (pair.txns?.h1?.sells ?? 0)

  if (liq < SECONDARY_FILTER.minLiquidityUsd) {
    return { passes: false, reason: `Liquidity $${liq} < $${SECONDARY_FILTER.minLiquidityUsd}` }
  }
  if (tx1h < SECONDARY_FILTER.minTx1h) {
    return { passes: false, reason: `Txs ${tx1h} < ${SECONDARY_FILTER.minTx1h}` }
  }

  // Layer 3: At least ONE momentum signal must fire
  const priceAbs = Math.abs(pair.priceChange?.h1 ?? 0)
  const vol1h = pair.volume?.h1 ?? 0
  const vol6h = pair.volume?.h6 ?? 0
  const vol6hAvg = vol6h > 0 ? vol1h / (vol6h / 6) : 0
  const buys1h = pair.txns?.h1?.buys ?? 0
  const sells1h = pair.txns?.h1?.sells ?? 1
  const buySellRatio = buys1h / sells1h
  const inverseBuySellRatio = sells1h / (buys1h || 1)

  const hasVolatility = priceAbs >= TERTIARY_FILTER.minPriceChangeAbsolute1h
  const hasVolumeSpike = vol6h > 0 && vol6hAvg >= TERTIARY_FILTER.minVolumeSpike1hVs6h
  const hasBuyPressure = buySellRatio >= TERTIARY_FILTER.minBuySellRatio || inverseBuySellRatio >= TERTIARY_FILTER.minBuySellRatio

  if (!hasVolatility && !hasVolumeSpike && !hasBuyPressure) {
    return { passes: false, reason: 'No momentum signal (price flat, no volume spike, balanced buys/sells)' }
  }

  return { passes: true }
}

// =============================================
// BOT PREDICTIONS (fake AI opinions for flair)
// =============================================

function generateBotPredictions(pair: DexScreenerPair, marketType: MarketType): Record<string, string> {
  const preds: Record<string, string> = {}
  const priceChange1h = pair.priceChange?.h1 ?? 0
  const rugScore = (pair as any).rugcheck_score ?? 50

  // Grok — momentum chaser
  if (marketType === 'up_down' || marketType === 'moonshot') {
    preds['ArenaBot_Grok'] = priceChange1h > 5 ? 'yes' : 'no'
  } else {
    preds['ArenaBot_Grok'] = rugScore < 30 ? 'yes' : 'no'
  }

  // Claude — conservative / contrarian
  if (marketType === 'up_down') {
    preds['ArenaBot_Claude'] = priceChange1h > 15 ? 'no' : priceChange1h < -10 ? 'yes' : (Math.random() > 0.5 ? 'yes' : 'no')
  } else if (marketType === 'rug_call') {
    const liq = pair.liquidity?.usd ?? 0
    preds['ArenaBot_Claude'] = liq < 10000 ? 'yes' : 'no'
  } else {
    preds['ArenaBot_Claude'] = 'no' // Claude never bets on moonshots
  }

  // ChatGPT — balanced
  if (marketType === 'rug_call') {
    preds['ArenaBot_ChatGPT'] = Math.random() > 0.6 ? 'yes' : 'no'
  } else {
    const buys = pair.txns?.h1?.buys ?? 0
    const sells = pair.txns?.h1?.sells ?? 0
    preds['ArenaBot_ChatGPT'] = buys > sells ? 'yes' : 'no'
  }

  return preds
}

// =============================================
// PUBLIC API
// =============================================

/**
 * Generate markets from currently active token matches.
 * Called by the cron job. Taps into our existing token monitoring pipeline.
 */
export async function generateMarkets(): Promise<{ created: number; skipped: number }> {
  const supabase = getServiceClient()
  const dex = new DexScreenerService()

  // 1. Get recent token matches from the last 2 hours (already surfaced by our monitoring cron)
  //    Pull galaxy_score — it's our primary filter for market-worthy tokens
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  const { data: recentMatches } = await supabase
    .from('token_matches')
    .select('token_address, token_name, token_symbol, dexscreener_url, liquidity, volume_24h, matched_at, rugcheck_score, galaxy_score')
    .gte('matched_at', twoHoursAgo)
    .order('matched_at', { ascending: false })
    .limit(50)

  if (!recentMatches?.length) {
    return { created: 0, skipped: 0 }
  }

  // 2. De-duplicate by token address
  const uniqueTokens = new Map<string, typeof recentMatches[0]>()
  for (const m of recentMatches) {
    if (!uniqueTokens.has(m.token_address)) {
      uniqueTokens.set(m.token_address, m)
    }
  }

  // 3. Check which tokens already have active markets (avoid duplicates)
  const addresses = Array.from(uniqueTokens.keys())
  const { data: existingMarkets } = await supabase
    .from('arena_markets')
    .select('token_address')
    .in('token_address', addresses)
    .eq('status', 'active')

  const existingSet = new Set((existingMarkets || []).map(m => m.token_address))

  // 4. Fetch fresh DexScreener data for candidates
  let created = 0
  let skipped = 0

  for (const [address, match] of uniqueTokens) {
    if (existingSet.has(address)) {
      skipped++
      continue
    }

    try {
      const pair = await dex.getTokenByAddress(address)
      if (!pair) { skipped++; continue }

      const filterResult = passesFilter(pair, match.galaxy_score ?? null)
      if (!filterResult.passes) { skipped++; continue }

      // Pick a random market template weighted toward up_down
      const weights = [3, 4, 1, 2] // 15min, 1hr, moonshot, rug
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * totalWeight
      let templateIdx = 0
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]
        if (r <= 0) { templateIdx = i; break }
      }
      const template = MARKET_TEMPLATES[templateIdx]

      const resolveAt = new Date(Date.now() + template.timeframeMinutes * 60 * 1000).toISOString()
      const price = parseFloat(pair.priceUsd || '0')
      if (price <= 0) { skipped++; continue }

      const timeframeStr = template.timeframeMinutes >= 60
        ? `${template.timeframeMinutes / 60} hour${template.timeframeMinutes > 60 ? 's' : ''}`
        : `${template.timeframeMinutes} minutes`

      const botPredictions = generateBotPredictions(pair, template.type)

      const { error } = await supabase.from('arena_markets').insert({
        token_address: address,
        token_name: match.token_name,
        token_symbol: match.token_symbol,
        chain: 'solana',
        market_type: template.type,
        question: template.question(match.token_symbol, ''),
        description: template.description(match.token_symbol, '', timeframeStr),
        price_at_creation: price,
        liquidity: pair.liquidity?.usd ?? null,
        volume_24h: pair.volume?.h24 ?? null,
        holder_count: null,
        rugcheck_score: match.rugcheck_score ?? null,
        resolve_at: resolveAt,
        status: 'active',
        bot_predictions: botPredictions,
        dexscreener_url: match.dexscreener_url,
      })

      if (!error) created++
      else { console.error('Market insert error:', error); skipped++ }
    } catch (err) {
      console.error(`Error processing ${address}:`, err)
      skipped++
    }
  }

  return { created, skipped }
}

/**
 * Resolve all markets that have passed their resolution time.
 */
export async function resolveMarkets(): Promise<{ resolved: number; cancelled: number; errors: number }> {
  const supabase = getServiceClient()
  const dex = new DexScreenerService()

  const now = new Date().toISOString()
  const { data: markets } = await supabase
    .from('arena_markets')
    .select('*')
    .eq('status', 'active')
    .lte('resolve_at', now)
    .limit(50)

  if (!markets?.length) return { resolved: 0, cancelled: 0, errors: 0 }

  let resolved = 0
  let cancelled = 0
  let errors = 0

  for (const market of markets) {
    try {
      // Fetch current price from DexScreener
      const pair = await dex.getTokenByAddress(market.token_address)
      const currentPrice = pair ? parseFloat(pair.priceUsd || '0') : 0

      if (currentPrice <= 0) {
        // Can't resolve — cancel and refund
        await cancelMarket(supabase, market)
        cancelled++
        continue
      }

      // Determine outcome
      const creationPrice = parseFloat(market.price_at_creation || '0')
      let outcome: 'yes' | 'no' = 'no'

      switch (market.market_type) {
        case 'up_down': {
          if (market.question.includes('10%+')) {
            outcome = currentPrice >= creationPrice * 1.1 ? 'yes' : 'no'
          } else {
            outcome = currentPrice > creationPrice ? 'yes' : 'no'
          }
          break
        }
        case 'moonshot':
          outcome = currentPrice >= creationPrice * 2 ? 'yes' : 'no'
          break
        case 'rug_call':
          outcome = currentPrice <= creationPrice * 0.2 ? 'yes' : 'no'
          break
      }

      // Update market
      await supabase.from('arena_markets').update({
        status: 'resolved',
        outcome,
        price_at_resolution: currentPrice,
        resolved_at: now,
      }).eq('id', market.id)

      // Calculate payouts
      await distributePayouts(supabase, market, outcome)
      resolved++
    } catch (err) {
      console.error(`Error resolving market ${market.id}:`, err)
      errors++
    }
  }

  return { resolved, cancelled, errors }
}

/**
 * Distribute points to winners from a resolved market.
 * Pari-mutuel style: losers' pool is distributed to winners proportionally.
 */
async function distributePayouts(
  supabase: ReturnType<typeof getServiceClient>,
  market: any,
  outcome: 'yes' | 'no'
): Promise<void> {
  // Get all bets for this market
  const { data: bets } = await supabase
    .from('arena_bets')
    .select('*')
    .eq('market_id', market.id)

  if (!bets?.length) return

  const winnerBets = bets.filter(b => b.position === outcome)
  const loserPool = bets.filter(b => b.position !== outcome).reduce((sum, b) => sum + b.amount, 0)
  const winnerPool = winnerBets.reduce((sum, b) => sum + b.amount, 0)
  const totalPool = loserPool + winnerPool

  // If no winners, refund everyone
  if (winnerBets.length === 0) {
    for (const bet of bets) {
      await supabase.rpc('refund_bet', { p_user_id: bet.user_id, p_amount: bet.amount })
      await supabase.from('arena_bets').update({ payout: bet.amount, is_winner: false }).eq('id', bet.id)
    }
    return
  }

  // If no losers, refund winners their stake
  if (loserPool === 0) {
    for (const bet of winnerBets) {
      await supabase.from('arena_bets').update({ payout: bet.amount, is_winner: true }).eq('id', bet.id)
      await creditPoints(supabase, bet.user_id, bet.amount, true)
    }
    // Mark losers
    for (const bet of bets.filter(b => b.position !== outcome)) {
      await supabase.from('arena_bets').update({ payout: 0, is_winner: false }).eq('id', bet.id)
      await updateStreak(supabase, bet.user_id, false)
    }
    return
  }

  // Pari-mutuel distribution
  for (const bet of winnerBets) {
    const share = bet.amount / winnerPool
    const payout = Math.round(bet.amount + (loserPool * share))
    const profit = payout - bet.amount

    await supabase.from('arena_bets').update({ payout, is_winner: true }).eq('id', bet.id)
    await creditPoints(supabase, bet.user_id, payout, true)
  }

  // Mark losers
  for (const bet of bets.filter(b => b.position !== outcome)) {
    await supabase.from('arena_bets').update({ payout: 0, is_winner: false }).eq('id', bet.id)
    await updateStreak(supabase, bet.user_id, false)
  }
}

async function cancelMarket(supabase: ReturnType<typeof getServiceClient>, market: any) {
  await supabase.from('arena_markets').update({ status: 'cancelled' }).eq('id', market.id)

  // Refund all bets
  const { data: bets } = await supabase
    .from('arena_bets')
    .select('*')
    .eq('market_id', market.id)

  if (bets) {
    for (const bet of bets) {
      await creditPoints(supabase, bet.user_id, bet.amount, false)
    }
  }
}

/**
 * Credit points to a user's balance and update stats.
 */
async function creditPoints(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  amount: number,
  isWin: boolean
) {
  // Ensure user_points row exists
  await supabase.from('user_points').upsert(
    { user_id: userId, balance: 500 },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  if (isWin) {
    // Credit balance + update win stats
    const { data } = await supabase
      .from('user_points')
      .select('balance, total_won, win_count, current_streak, best_streak')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      const newStreak = (data.current_streak ?? 0) + 1
      await supabase.from('user_points').update({
        balance: (data.balance ?? 0) + amount,
        total_won: (data.total_won ?? 0) + amount,
        total_earned: (data.total_won ?? 0) + amount,
        win_count: (data.win_count ?? 0) + 1,
        current_streak: newStreak,
        best_streak: Math.max(newStreak, data.best_streak ?? 0),
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId)
    }
  } else {
    // Just credit balance (refund case)
    const { data } = await supabase
      .from('user_points')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      await supabase.from('user_points').update({
        balance: (data.balance ?? 0) + amount,
      }).eq('user_id', userId)
    }
  }
}

async function updateStreak(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  isWin: boolean
) {
  const { data } = await supabase
    .from('user_points')
    .select('current_streak, best_streak, loss_count')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) {
    await supabase.from('user_points').update({
      current_streak: isWin ? (data.current_streak ?? 0) + 1 : 0,
      loss_count: isWin ? data.loss_count : (data.loss_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
  }
}

/**
 * Claim daily points bonus (100 points per day).
 */
export async function claimDailyPoints(userId: string): Promise<{ success: boolean; balance: number; message: string }> {
  const supabase = getServiceClient()

  // Ensure user_points row exists
  await supabase.from('user_points').upsert(
    { user_id: userId, balance: 500 },
    { onConflict: 'user_id', ignoreDuplicates: true }
  )

  const { data: points } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!points) return { success: false, balance: 0, message: 'User not found' }

  const now = new Date()
  const lastClaim = points.last_daily_claim ? new Date(points.last_daily_claim) : null

  if (lastClaim) {
    const hoursSince = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
    if (hoursSince < 24) {
      const hoursLeft = Math.ceil(24 - hoursSince)
      return { success: false, balance: points.balance, message: `Next claim in ${hoursLeft}h` }
    }
  }

  const dailyBonus = 100
  const newBalance = (points.balance ?? 0) + dailyBonus

  await supabase.from('user_points').update({
    balance: newBalance,
    total_earned: (points.total_earned ?? 0) + dailyBonus,
    last_daily_claim: now.toISOString(),
    updated_at: now.toISOString(),
  }).eq('user_id', userId)

  return { success: true, balance: newBalance, message: `+${dailyBonus} points claimed!` }
}
