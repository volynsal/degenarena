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

// =============================================
// NARRATIVE AUTO-DETECTION
// =============================================

function detectNarrative(symbol: string, name: string): string | null {
  const s = symbol.toLowerCase()
  const n = name.toLowerCase()
  const combined = `${s} ${n}`

  // Political
  if (/trump|biden|maga|kamala|potus|election|congress|senate|patriot/.test(combined)) return 'political'
  // AI Agents
  if (/\bai\b|agent|gpt|neural|llm|sentient|cortex|brain|singularity/.test(combined)) return 'ai_agents'
  // Celebrity
  if (/elon|musk|drake|kanye|ye\b|taylor|celebrity|famous/.test(combined)) return 'celebrity'
  // Super Bowl / sports events
  if (/super.?bowl|nfl|patriots|seahawks|chiefs|eagles|touchdown/.test(combined)) return 'super_bowl'
  // Revenge pump / comeback
  if (/revenge|comeback|return|revival|phoenix|resurrect/.test(combined)) return 'revenge_pump'
  // Meta wars / competitive narratives
  if (/war|battle|\bvs\b|flip|dethrone|king|queen|crown|rival|clash|dominat/.test(combined)) return 'meta_wars'

  return null // No specific narrative detected — will show without a tag
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
  // ── CULTURE / META MARKETS ──
  // Culturally-framed markets. Resolve on price as a proxy for virality/buzz.
  // Virality / going mainstream
  {
    type: 'culture',
    question: (s) => `Will $${s} go viral today? 10%+ pump incoming?`,
    description: (s, _, tf) => `The culture is watching. Predict whether $${s} catches fire and pumps 10%+ within ${tf}. Memes, tweets, and vibes only.`,
    timeframeMinutes: 240,
  },
  // CT (Crypto Twitter) momentum
  {
    type: 'culture',
    question: (s) => `Is CT about to send $${s} to the moon? 25%+ in 4 hours?`,
    description: (s, _, tf) => `Crypto Twitter is talking. Predict whether the hype around $${s} translates to a 25%+ pump within ${tf}.`,
    timeframeMinutes: 240,
  },
  // Cultural moment / event-driven
  {
    type: 'culture',
    question: (s) => `Will $${s} be the breakout memecoin of the day and double?`,
    description: (s, _, tf) => `Every day has a main character. Predict whether $${s} doubles within ${tf} and becomes today's headline coin.`,
    timeframeMinutes: 360,
  },
  // Celebrity / influencer catalyst
  {
    type: 'culture',
    question: (s) => `Will a major influencer pump $${s} 20%+ in the next few hours?`,
    description: (s, _, tf) => `One tweet can change everything. Predict whether $${s} gets the signal boost it needs to pump 20%+ within ${tf}.`,
    timeframeMinutes: 180,
  },
  // Narrative survival / staying power
  {
    type: 'culture',
    question: (s) => `Does $${s} have staying power or is the hype already dead?`,
    description: (s, _, tf) => `Memecoins live and die by the narrative. Predict whether $${s} holds above its current price over the next ${tf} — or fades into nothing.`,
    timeframeMinutes: 360,
  },
  // Meta rotation play
  {
    type: 'culture',
    question: (s) => `Will $${s} catch the next meta rotation? 15%+ pump?`,
    description: (s, _, tf) => `Narratives rotate fast. Predict whether $${s} rides the next wave and gains 15%+ within ${tf}.`,
    timeframeMinutes: 180,
  },
]

// =============================================
// MARKET GENERATION FILTERS (2-layer, no LunarCrush dependency)
// =============================================

// Layer 1 — SAFETY: On-chain floor (DexScreener data)
// Prevents markets on dead tokens with no real trading activity
const SAFETY_FILTER = {
  minLiquidityUsd: 5000,  // $5K+ liquidity — can't be easily manipulated
  minTx1h: 15,            // At least 15 txs in the last hour — real activity
}

// Layer 2 — MOMENTUM: Volatility / interest (makes the market interesting to bet on)
// At least one of these must be true — ensures the token isn't flat-lining
const MOMENTUM_FILTER = {
  minPriceChangeAbsolute1h: 3, // 3%+ swing in either direction
  minVolumeSpike1hVs6h: 1.5,  // 1h vol is 1.5x the 6h average
  minBuySellRatio: 1.3,       // Buy pressure: buys > 1.3x sells (or inverse)
}

interface FilterResult {
  passes: boolean
  reason?: string
}

function passesFilter(pair: DexScreenerPair): FilterResult {
  // Layer 1: On-chain safety
  const liq = pair.liquidity?.usd ?? 0
  const tx1h = (pair.txns?.h1?.buys ?? 0) + (pair.txns?.h1?.sells ?? 0)

  if (liq < SAFETY_FILTER.minLiquidityUsd) {
    return { passes: false, reason: `Liquidity $${liq} < $${SAFETY_FILTER.minLiquidityUsd}` }
  }
  if (tx1h < SAFETY_FILTER.minTx1h) {
    return { passes: false, reason: `Txs ${tx1h} < ${SAFETY_FILTER.minTx1h}` }
  }

  // Layer 2: At least ONE momentum signal must fire
  const priceAbs = Math.abs(pair.priceChange?.h1 ?? 0)
  const vol1h = pair.volume?.h1 ?? 0
  const vol6h = pair.volume?.h6 ?? 0
  const vol6hAvg = vol6h > 0 ? vol1h / (vol6h / 6) : 0
  const buys1h = pair.txns?.h1?.buys ?? 0
  const sells1h = pair.txns?.h1?.sells ?? 1
  const buySellRatio = buys1h / sells1h
  const inverseBuySellRatio = sells1h / (buys1h || 1)

  const hasVolatility = priceAbs >= MOMENTUM_FILTER.minPriceChangeAbsolute1h
  const hasVolumeSpike = vol6h > 0 && vol6hAvg >= MOMENTUM_FILTER.minVolumeSpike1hVs6h
  const hasBuyPressure = buySellRatio >= MOMENTUM_FILTER.minBuySellRatio || inverseBuySellRatio >= MOMENTUM_FILTER.minBuySellRatio

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
  if (marketType === 'up_down' || marketType === 'moonshot' || marketType === 'culture') {
    preds['ArenaBot_Grok'] = priceChange1h > 5 ? 'yes' : 'no'
  } else {
    preds['ArenaBot_Grok'] = rugScore < 30 ? 'yes' : 'no'
  }

  // Claude — conservative / contrarian
  if (marketType === 'up_down' || marketType === 'culture') {
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
 * Generate markets from DexScreener trending/boosted tokens + token_matches.
 * Two sources:
 *   1. DexScreener boosted tokens (social signal — people are promoting/trading them)
 *   2. Our own token_matches table (formula monitoring pipeline)
 * No LunarCrush dependency — uses DexScreener trending as the social signal.
 */
export async function generateMarkets(): Promise<{ created: number; skipped: number; source: string }> {
  const supabase = getServiceClient()
  const dex = new DexScreenerService()

  // Collect candidate pairs from multiple sources
  const candidatePairs: Map<string, DexScreenerPair> = new Map()

  // ── SOURCE 1: DexScreener trending/boosted tokens (primary social signal) ──
  try {
    console.log('📡 Fetching DexScreener trending tokens...')
    const boostedResponse = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
      headers: { 'Accept': 'application/json' },
    })

    if (boostedResponse.ok) {
      const boostedTokens = await boostedResponse.json()
      // Filter to Solana tokens only
      const solanaTokens = (boostedTokens || [])
        .filter((t: any) => t.chainId === 'solana')
        .slice(0, 20)

      // Batch-fetch full pair data
      const addresses = solanaTokens.map((t: any) => t.tokenAddress).filter(Boolean)
      for (let i = 0; i < addresses.length; i += 15) {
        const batch = addresses.slice(i, i + 15).join(',')
        try {
          const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch}`, {
            headers: { 'Accept': 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            for (const pair of (data.pairs || [])) {
              if (pair.chainId === 'solana' && !candidatePairs.has(pair.baseToken.address)) {
                candidatePairs.set(pair.baseToken.address, pair)
              }
            }
          }
        } catch {}
      }
      console.log(`  → ${candidatePairs.size} trending Solana pairs found`)
    }
  } catch (err) {
    console.error('DexScreener trending fetch error:', err)
  }

  // ── SOURCE 2: Recent token_matches from our monitoring pipeline ──
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: recentMatches } = await supabase
      .from('token_matches')
      .select('token_address, token_name, token_symbol, dexscreener_url, rugcheck_score')
      .gte('matched_at', twoHoursAgo)
      .order('matched_at', { ascending: false })
      .limit(30)

    if (recentMatches?.length) {
      console.log(`📊 Found ${recentMatches.length} recent token matches`)
      for (const match of recentMatches) {
        if (!candidatePairs.has(match.token_address)) {
          try {
            const pair = await dex.getTokenByAddress(match.token_address)
            if (pair) {
              candidatePairs.set(match.token_address, pair)
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    console.error('Token matches fetch error:', err)
  }

  if (candidatePairs.size === 0) {
    console.log('⚠️ No candidate tokens from any source')
    return { created: 0, skipped: 0, source: 'none' }
  }

  console.log(`🔍 Filtering ${candidatePairs.size} total candidates...`)

  // ── CHECK EXISTING ACTIVE MARKETS (avoid duplicates) ──
  const allAddresses = Array.from(candidatePairs.keys())
  const { data: existingMarkets } = await supabase
    .from('arena_markets')
    .select('token_address')
    .in('token_address', allAddresses)
    .eq('status', 'active')

  const existingSet = new Set((existingMarkets || []).map(m => m.token_address))

  // ── CREATE MARKETS ──
  let created = 0
  let skipped = 0
  const maxNewMarkets = 5 // Cap per cron run to avoid flooding

  for (const [address, pair] of Array.from(candidatePairs.entries())) {
    if (created >= maxNewMarkets) break
    if (existingSet.has(address)) { skipped++; continue }

    const filterResult = passesFilter(pair)
    if (!filterResult.passes) {
      console.log(`  ✗ ${pair.baseToken.symbol}: ${filterResult.reason}`)
      skipped++
      continue
    }

    try {
      // Detect narrative for this token
      const narrative = detectNarrative(pair.baseToken.symbol, pair.baseToken.name)

      // Pick a market template — narrative tokens are biased toward culture templates
      //   Indices: 0=up_down 15m, 1=up_down 1h, 2=moonshot, 3=rug,
      //            4=viral, 5=CT hype, 6=breakout, 7=influencer, 8=staying power, 9=meta rotation
      let weights: number[]
      if (narrative) {
        // Strong narrative detected → heavily favor culture templates
        weights = [1, 1, 1, 1, 2, 2, 1, 2, 1, 2] // culture ~10/14
      } else {
        // No narrative → mostly price-based, small chance of culture
        weights = [3, 4, 1, 2, 1, 1, 0, 0, 0, 0] // culture ~2/12
      }
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

      // Assign 'trending' narrative to culture markets that don't have a specific one
      const marketNarrative = (template.type === 'culture' && !narrative) ? 'trending' : narrative

      const { error } = await supabase.from('arena_markets').insert({
        token_address: address,
        token_name: pair.baseToken.name,
        token_symbol: pair.baseToken.symbol,
        chain: 'solana',
        market_type: template.type,
        question: template.question(pair.baseToken.symbol, ''),
        description: template.description(pair.baseToken.symbol, '', timeframeStr),
        narrative: marketNarrative,
        price_at_creation: price,
        liquidity: pair.liquidity?.usd ?? null,
        volume_24h: pair.volume?.h24 ?? null,
        holder_count: null,
        rugcheck_score: null,
        resolve_at: resolveAt,
        status: 'active',
        bot_predictions: botPredictions,
        dexscreener_url: pair.url,
      })

      if (!error) {
        console.log(`  ✓ Created market: ${pair.baseToken.symbol} (${template.type}, ${timeframeStr})`)
        created++
      } else {
        console.error('Market insert error:', error)
        skipped++
      }
    } catch (err) {
      console.error(`Error processing ${address}:`, err)
      skipped++
    }
  }

  return { created, skipped, source: `trending:${candidatePairs.size}` }
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
        case 'culture': {
          // Culture markets encode their threshold in the question text.
          // Price movement is used as a proxy for virality/cultural momentum.
          const q = market.question.toLowerCase()
          const thresholdMatch = market.question.match(/(\d+)%\+?/)
          if (q.includes('double')) {
            // "doubles" = 2x
            outcome = currentPrice >= creationPrice * 2 ? 'yes' : 'no'
          } else if (thresholdMatch) {
            // e.g. "10%+", "25%+", "20%+", "15%+"
            const threshold = parseInt(thresholdMatch[1]) / 100
            outcome = currentPrice >= creationPrice * (1 + threshold) ? 'yes' : 'no'
          } else if (q.includes('staying power') || q.includes('holds above') || q.includes('hold above')) {
            // Staying power / survival = still above creation price
            outcome = currentPrice >= creationPrice ? 'yes' : 'no'
          } else {
            // Fallback: treat like up_down
            outcome = currentPrice > creationPrice ? 'yes' : 'no'
          }
          break
        }
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
      await creditPoints(supabase, bet.user_id, bet.amount, false)
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
