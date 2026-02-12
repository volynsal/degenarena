import { createClient } from '@supabase/supabase-js'
import { DexScreenerService, type DexScreenerPair } from './dexscreener'
import type { ArenaMarket, MarketType } from '@/types/database'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Points awarded/deducted when a market resolves with no opposition
// (solo bettor or all bets on the same side)
const SOLO_MARKET_BONUS = 50

// =============================================
// MARKET TEMPLATES
// =============================================

interface MarketTemplate {
  type: MarketType
  narrativeHint?: string // Force this narrative regardless of token detection
  question: (symbol: string, target: string) => string
  description: (symbol: string, target: string, timeframe: string) => string
  timeframeMinutes: number
}

// Versus market templates (token A vs token B)
interface VersusTemplate {
  question: (symbolA: string, symbolB: string) => string
  description: (symbolA: string, symbolB: string, timeframe: string) => string
  timeframeMinutes: number
}

const VERSUS_TEMPLATES: VersusTemplate[] = [
  {
    question: (a, b) => `Who wins the 4-hour race: $${a} or $${b}?`,
    description: (a, b, tf) => `Head-to-head showdown. Predict whether $${a} outperforms $${b} in the next ${tf}. YES = $${a} wins, NO = $${b} wins. Relative % change decides it.`,
    timeframeMinutes: 240,
  },
  {
    question: (a, b) => `$${a} vs $${b} — who pumps harder in the next hour?`,
    description: (a, b, tf) => `Two tokens, one winner. Which one has more momentum over the next ${tf}? YES = $${a}, NO = $${b}.`,
    timeframeMinutes: 60,
  },
  {
    question: (a, b) => `The rivalry: $${a} or $${b} for the next 2 hours?`,
    description: (a, b, tf) => `Pick your side. $${a} and $${b} are going head-to-head. Best % performance over ${tf} wins. YES = $${a}, NO = $${b}.`,
    timeframeMinutes: 120,
  },
]

// Narrative Index templates
interface IndexTemplate {
  question: (narrative: string) => string
  description: (narrative: string, tokenCount: number, timeframe: string) => string
  thresholdPct: number
  timeframeMinutes: number
}

const INDEX_TEMPLATES: IndexTemplate[] = [
  {
    question: (n) => `Will ${n} tokens pump 5%+ as a group in 4 hours?`,
    description: (n, count, tf) => `The ${n} index: top ${count} tokens averaged. Predict whether the group gains 5%+ within ${tf}. Single rugs get filtered out.`,
    thresholdPct: 5,
    timeframeMinutes: 240,
  },
  {
    question: (n) => `Are ${n} memecoins going to keep pumping today?`,
    description: (n, count, tf) => `The ${n} narrative is hot. Will the top ${count} tokens sustain 3%+ average gains over ${tf}? YES = still pumping, NO = fading.`,
    thresholdPct: 3,
    timeframeMinutes: 360,
  },
]

// Culture-Crypto hybrid templates (culturally framed, auto-resolved on crypto data)
interface CultureCryptoTemplate {
  question: (narrative: string) => string
  description: (narrative: string, timeframe: string) => string
  metric: 'market_cap_threshold' | 'narrative_vs_narrative' | 'new_entrant_count' | 'volume_spike'
  timeframeMinutes: number
}

const CULTURE_CRYPTO_TEMPLATES: CultureCryptoTemplate[] = [
  {
    question: (n) => `Will a ${n} token hit $1M+ market cap in the next 6 hours?`,
    description: (n, tf) => `The ${n} hype is real. Predict whether any ${n} token crosses $1M market cap within ${tf}. Resolved on DexScreener data.`,
    metric: 'market_cap_threshold',
    timeframeMinutes: 360,
  },
  {
    question: (n) => `Will a new ${n} token enter DexScreener trending today?`,
    description: (n, tf) => `New entrants keep the narrative alive. Predict whether a fresh ${n} token appears in DexScreener trending within ${tf}.`,
    metric: 'new_entrant_count',
    timeframeMinutes: 480,
  },
  {
    question: (n) => `Will ${n} tokens see a 2x volume spike in the next 4 hours?`,
    description: (n, tf) => `Volume is the heartbeat of a narrative. Predict whether total volume across ${n} tokens doubles within ${tf}.`,
    metric: 'volume_spike',
    timeframeMinutes: 240,
  },
]

// Meta / Ecosystem templates
interface MetaTemplate {
  question: () => string
  description: (timeframe: string) => string
  metric: 'trending_leader_change' | 'new_top10' | 'volume_increase'
  timeframeMinutes: number
}

const META_TEMPLATES: MetaTemplate[] = [
  {
    question: () => `Will the #1 DexScreener trending token change in 4 hours?`,
    description: (tf) => `The crown is heavy. Predict whether the current #1 trending token on DexScreener gets dethroned within ${tf}.`,
    metric: 'trending_leader_change',
    timeframeMinutes: 240,
  },
  {
    question: () => `Will a brand new token enter the DexScreener top 10 today?`,
    description: (tf) => `Fresh blood or same old faces? Predict whether a new token (listed < 24h ago) breaks into the DexScreener top 10 trending within ${tf}.`,
    metric: 'new_top10',
    timeframeMinutes: 480,
  },
  {
    question: () => `Will total top-10 trending volume increase 50%+ in 4 hours?`,
    description: (tf) => `Momentum check. Predict whether the combined volume of the top 10 DexScreener trending tokens increases 50%+ within ${tf}.`,
    metric: 'volume_increase',
    timeframeMinutes: 240,
  },
]

// Narrative display labels for market text
const NARRATIVE_LABELS: Record<string, string> = {
  super_bowl: 'Super Bowl',
  ai_agents: 'AI Agent',
  political: 'Political',
  celebrity: 'Celebrity',
  seasonal: 'Seasonal',
  revenge_pump: 'Revenge Pump',
  meta_wars: 'Meta Wars',
  trending: 'Trending',
}

// =============================================
// NARRATIVE AUTO-DETECTION
// =============================================

export function detectNarrative(symbol: string, name: string): string | null {
  const s = symbol.toLowerCase()
  const n = name.toLowerCase()
  const combined = `${s} ${n}`

  // Political — politicians, parties, government
  if (/trump|biden|maga|kamala|potus|election|congress|senate|patriot|desantis|vivek|rfk|democrat|republican|pelosi|obama|whitehouse|governer|politician|politic/.test(combined)) return 'political'

  // AI Agents — artificial intelligence, bots, models
  if (/\bai\b|agent|gpt|neural|llm|sentient|cortex|brain|singularity|openai|claude|gemini|copilot|tensor|deepseek|mistral|perplexity|chatbot|machine.?learn/.test(combined)) return 'ai_agents'

  // Celebrity — musicians, athletes, influencers, public figures
  if (/elon|musk|drake|kanye|ye\b|taylor|swift|celebrity|famous|badbunny|bad.?bunny|rihanna|beyonce|kardashian|jenner|bieber|weeknd|travis.?scott|snoop|diddy|eminem|nicki|minaj|cardi|doja|billie|eilish|post.?malone|shaq|lebron|messi|ronaldo|zuckerberg|bezos|oprah|rogan|mr.?beast|pewdiepie|ninja|adin.?ross|kai.?cenat|speed\b|ishowspeed|logan.?paul|jake.?paul|tate\b|andrew.?tate|milei/.test(combined)) return 'celebrity'

  // Sports — teams, leagues, events
  if (/super.?bowl|nfl|nba|mlb|ufc|fifa|world.?cup|patriots|seahawks|chiefs|eagles|lakers|celtics|warriors|cowboys|steelers|niners|ravens|bulls|yankees|dodgers|touchdown|slam.?dunk|knockout|playoff|championship|derby|formula.?1|\bf1\b|premier.?league/.test(combined)) return 'super_bowl'

  // CT — crypto twitter native meme culture
  if (/degen|wagmi|ngmi|\bgm\b|hodl|fomo|based|copium|hopium|pepe|wojak|chad\b|doge|shib|floki|bonk|brett|andy\b|matt.?furie|4chan|ponzi|rugged|rug\b|jeet|moon.?boy|ct\b|crypto.?twitter|solana.?summer|pump.?fun|pumpfun|memecoin|meme.?coin|wif\b|popcat|mother|slerf|boden|tremp|book.?of/.test(combined)) return 'ct'

  // Seasonal — holidays, cultural events, annual moments (not sports)
  if (/christmas|xmas|santa|holiday|halloween|spooky|pumpkin|skeleton|ghost|turkey|thanksgiv|easter|bunny|valentine|cupid|love.?day|st.?patrick|shamrock|clover|new.?year|nye|firework|4th.?of.?july|fourth.?of.?july|independence|memorial.?day|labor.?day|cinco.?de.?mayo|lunar.?new|chinese.?new|diwali|hanukkah|kwanzaa|ramadan|eid|mothers?.?day|fathers?.?day|black.?friday|cyber.?monday|grammy|oscar|emmy|golden.?globe|coachella|burning.?man|comic.?con|festival|solstice|equinox/.test(combined)) return 'seasonal'

  // Culture — brands, fashion, internet culture, gaming
  if (/bape|supreme|nike|gucci|louis.?vuitton|prada|balenciaga|yeezy|offwhite|off.?white|stussy|kith|jordan\b|dior|chanel|versace|burberry|hermes|rolex|ferrari|lambo|lamborghini|porsche|tesla\b|mcdonalds|wendys|starbucks|coca.?cola|pepsi|redbull|tiktok|youtube|twitch\b|discord|reddit|anime|manga|naruto|goku|one.?piece|pokemon|pikachu|mario|zelda|minecraft|fortnite|roblox/.test(combined)) return 'culture'

  // Revenge pump / comeback
  if (/revenge|comeback|return|revival|phoenix|resurrect|redemption|rise.?again|back.?from/.test(combined)) return 'revenge_pump'

  return null
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
    narrativeHint: 'ct',
    question: (s) => `Will $${s} go viral today? 10%+ pump incoming?`,
    description: (s, _, tf) => `The culture is watching. Predict whether $${s} catches fire and pumps 10%+ within ${tf}. Memes, tweets, and vibes only.`,
    timeframeMinutes: 240,
  },
  // CT (Crypto Twitter) momentum
  {
    type: 'culture',
    narrativeHint: 'ct',
    question: (s) => `Is CT about to send $${s} to the moon? 25%+ in 4 hours?`,
    description: (s, _, tf) => `Crypto Twitter is talking. Predict whether the hype around $${s} translates to a 25%+ pump within ${tf}.`,
    timeframeMinutes: 240,
  },
  // Cultural moment / event-driven
  {
    type: 'culture',
    narrativeHint: 'ct',
    question: (s) => `Will $${s} be the breakout memecoin of the day and double?`,
    description: (s, _, tf) => `Every day has a main character. Predict whether $${s} doubles within ${tf} and becomes today's headline coin.`,
    timeframeMinutes: 360,
  },
  // Celebrity / influencer catalyst
  {
    type: 'culture',
    narrativeHint: 'celebrity',
    question: (s) => `Will a major influencer pump $${s} 20%+ in the next few hours?`,
    description: (s, _, tf) => `One tweet can change everything. Predict whether $${s} gets the signal boost it needs to pump 20%+ within ${tf}.`,
    timeframeMinutes: 180,
  },
  // Narrative survival / staying power
  {
    type: 'culture',
    narrativeHint: 'ct',
    question: (s) => `Does $${s} have staying power or is the hype already dead?`,
    description: (s, _, tf) => `Memecoins live and die by the narrative. Predict whether $${s} holds above its current price over the next ${tf} — or fades into nothing.`,
    timeframeMinutes: 360,
  },
  // Meta rotation play
  {
    type: 'culture',
    narrativeHint: 'ct',
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

      // Narrative priority: token-level detection > template hint > 'trending' fallback for culture
      const marketNarrative = narrative || template.narrativeHint || (template.type === 'culture' ? 'trending' : null)

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

  // ── GENERATE NEW MARKET TYPES (versus, index, culture_crypto, meta) ──
  // These use the same candidate pairs but create different market structures
  const filteredPairs = Array.from(candidatePairs.entries())
    .filter(([addr]) => !existingSet.has(addr))
    .filter(([, pair]) => passesFilter(pair).passes)
    .map(([addr, pair]) => ({ address: addr, pair, narrative: detectNarrative(pair.baseToken.symbol, pair.baseToken.name) }))

  // ── VERSUS MARKETS: Pair tokens from same narrative ──
  const narrativeGroups: Record<string, typeof filteredPairs> = {}
  for (const item of filteredPairs) {
    if (item.narrative) {
      if (!narrativeGroups[item.narrative]) narrativeGroups[item.narrative] = []
      narrativeGroups[item.narrative].push(item)
    }
  }

  let versusCreated = 0
  for (const [, group] of Object.entries(narrativeGroups)) {
    if (group.length < 2 || versusCreated >= 2) continue

    // Pick two tokens from this narrative group
    const shuffled = group.sort(() => Math.random() - 0.5)
    const tokenA = shuffled[0]
    const tokenB = shuffled[1]
    const priceA = parseFloat(tokenA.pair.priceUsd || '0')
    const priceB = parseFloat(tokenB.pair.priceUsd || '0')
    if (priceA <= 0 || priceB <= 0) continue

    // Check no existing versus market for these tokens
    const { data: existingVersus } = await supabase
      .from('arena_markets')
      .select('id')
      .eq('market_type', 'versus')
      .eq('status', 'active')
      .or(`token_address.eq.${tokenA.address},token_address.eq.${tokenB.address}`)
      .limit(1)

    if (existingVersus && existingVersus.length > 0) continue

    const vTemplate = VERSUS_TEMPLATES[Math.floor(Math.random() * VERSUS_TEMPLATES.length)]
    const resolveAt = new Date(Date.now() + vTemplate.timeframeMinutes * 60 * 1000).toISOString()
    const timeframeStr = vTemplate.timeframeMinutes >= 60
      ? `${vTemplate.timeframeMinutes / 60} hour${vTemplate.timeframeMinutes > 60 ? 's' : ''}`
      : `${vTemplate.timeframeMinutes} minutes`

    const { error: versusErr } = await supabase.from('arena_markets').insert({
      token_address: tokenA.address,
      token_name: tokenA.pair.baseToken.name,
      token_symbol: tokenA.pair.baseToken.symbol,
      chain: 'solana',
      market_type: 'versus',
      question: vTemplate.question(tokenA.pair.baseToken.symbol, tokenB.pair.baseToken.symbol),
      description: vTemplate.description(tokenA.pair.baseToken.symbol, tokenB.pair.baseToken.symbol, timeframeStr),
      narrative: tokenA.narrative,
      price_at_creation: priceA,
      resolve_at: resolveAt,
      status: 'active',
      bot_predictions: {},
      dexscreener_url: tokenA.pair.url,
      market_data: {
        token_b: {
          address: tokenB.address,
          symbol: tokenB.pair.baseToken.symbol,
          name: tokenB.pair.baseToken.name,
          price_at_creation: priceB,
          dexscreener_url: tokenB.pair.url,
        }
      },
    })

    if (!versusErr) {
      console.log(`  ⚔️ Created versus: ${tokenA.pair.baseToken.symbol} vs ${tokenB.pair.baseToken.symbol}`)
      created++
      versusCreated++
    }
  }

  // ── NARRATIVE INDEX MARKETS ──
  let indexCreated = 0
  for (const [narrative, group] of Object.entries(narrativeGroups)) {
    if (group.length < 3 || indexCreated >= 1) continue

    // Check no existing index for this narrative
    const { data: existingIndex } = await supabase
      .from('arena_markets')
      .select('id')
      .eq('market_type', 'narrative_index')
      .eq('status', 'active')
      .eq('narrative', narrative)
      .limit(1)

    if (existingIndex && existingIndex.length > 0) continue

    const basket = group.slice(0, 5).map(item => ({
      address: item.address,
      symbol: item.pair.baseToken.symbol,
      price_at_creation: parseFloat(item.pair.priceUsd || '0'),
    })).filter(t => t.price_at_creation > 0)

    if (basket.length < 3) continue

    const iTemplate = INDEX_TEMPLATES[Math.floor(Math.random() * INDEX_TEMPLATES.length)]
    const narrativeLabel = NARRATIVE_LABELS[narrative] || narrative
    const resolveAt = new Date(Date.now() + iTemplate.timeframeMinutes * 60 * 1000).toISOString()
    const timeframeStr = iTemplate.timeframeMinutes >= 60
      ? `${iTemplate.timeframeMinutes / 60} hour${iTemplate.timeframeMinutes > 60 ? 's' : ''}`
      : `${iTemplate.timeframeMinutes} minutes`

    const { error: indexErr } = await supabase.from('arena_markets').insert({
      token_address: null,
      token_name: `${narrativeLabel} Index`,
      token_symbol: `${narrativeLabel.toUpperCase()}_IDX`,
      chain: 'solana',
      market_type: 'narrative_index',
      question: iTemplate.question(narrativeLabel),
      description: iTemplate.description(narrativeLabel, basket.length, timeframeStr),
      narrative: narrative,
      price_at_creation: null,
      resolve_at: resolveAt,
      status: 'active',
      bot_predictions: {},
      market_data: {
        narrative,
        threshold_pct: iTemplate.thresholdPct,
        tokens: basket,
      },
    })

    if (!indexErr) {
      console.log(`  📊 Created index: ${narrativeLabel} (${basket.length} tokens, ${iTemplate.thresholdPct}%+ threshold)`)
      created++
      indexCreated++
    }
  }

  // ── CULTURE-CRYPTO HYBRID MARKETS ──
  // Created when a narrative has 2+ tokens (cultural moment is happening)
  let cultureCryptoCreated = 0
  for (const [narrative, group] of Object.entries(narrativeGroups)) {
    if (group.length < 2 || cultureCryptoCreated >= 1) continue

    // Check no existing culture_crypto for this narrative
    const { data: existingCC } = await supabase
      .from('arena_markets')
      .select('id')
      .eq('market_type', 'culture_crypto')
      .eq('status', 'active')
      .eq('narrative', narrative)
      .limit(1)

    if (existingCC && existingCC.length > 0) continue

    const ccTemplate = CULTURE_CRYPTO_TEMPLATES[Math.floor(Math.random() * CULTURE_CRYPTO_TEMPLATES.length)]
    const narrativeLabel = NARRATIVE_LABELS[narrative] || narrative
    const resolveAt = new Date(Date.now() + ccTemplate.timeframeMinutes * 60 * 1000).toISOString()
    const timeframeStr = ccTemplate.timeframeMinutes >= 60
      ? `${ccTemplate.timeframeMinutes / 60} hour${ccTemplate.timeframeMinutes > 60 ? 's' : ''}`
      : `${ccTemplate.timeframeMinutes} minutes`

    // Snapshot current state for resolution
    const snapshotTokens = group.slice(0, 5).map(item => ({
      address: item.address,
      symbol: item.pair.baseToken.symbol,
      market_cap: (item.pair as any).marketCap ?? item.pair.fdv ?? 0,
      volume_1h: item.pair.volume?.h1 ?? 0,
    }))

    const totalVolume = snapshotTokens.reduce((sum, t) => sum + t.volume_1h, 0)

    const { error: ccErr } = await supabase.from('arena_markets').insert({
      token_address: null,
      token_name: `${narrativeLabel} Culture`,
      token_symbol: `${narrativeLabel.toUpperCase()}_CC`,
      chain: 'solana',
      market_type: 'culture_crypto',
      question: ccTemplate.question(narrativeLabel),
      description: ccTemplate.description(narrativeLabel, timeframeStr),
      narrative: narrative,
      price_at_creation: null,
      resolve_at: resolveAt,
      status: 'active',
      bot_predictions: {},
      market_data: {
        metric: ccTemplate.metric,
        narrative,
        snapshot_tokens: snapshotTokens,
        snapshot_total_volume: totalVolume,
        market_cap_threshold: 1000000, // $1M for market_cap_threshold metric
      },
    })

    if (!ccErr) {
      console.log(`  🎭 Created culture-crypto: ${narrativeLabel} (${ccTemplate.metric})`)
      created++
      cultureCryptoCreated++
    }
  }

  // ── META / ECOSYSTEM MARKETS ──
  // One per cron run max — about the DexScreener ecosystem, not specific tokens
  const { data: existingMeta } = await supabase
    .from('arena_markets')
    .select('id')
    .eq('market_type', 'meta')
    .eq('status', 'active')
    .limit(1)

  if (!existingMeta || existingMeta.length === 0) {
    try {
      // Snapshot the current DexScreener trending state
      const trendingRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
        headers: { 'Accept': 'application/json' },
      })

      if (trendingRes.ok) {
        const trendingTokens = await trendingRes.json()
        const solanaTop10 = (trendingTokens || [])
          .filter((t: any) => t.chainId === 'solana')
          .slice(0, 10)

        if (solanaTop10.length >= 5) {
          const metaTemplate = META_TEMPLATES[Math.floor(Math.random() * META_TEMPLATES.length)]
          const resolveAt = new Date(Date.now() + metaTemplate.timeframeMinutes * 60 * 1000).toISOString()
          const timeframeStr = metaTemplate.timeframeMinutes >= 60
            ? `${metaTemplate.timeframeMinutes / 60} hour${metaTemplate.timeframeMinutes > 60 ? 's' : ''}`
            : `${metaTemplate.timeframeMinutes} minutes`

          // Get volume data for the top tokens
          const topAddresses = solanaTop10.slice(0, 10).map((t: any) => t.tokenAddress).filter(Boolean)
          let topPairsData: any[] = []
          if (topAddresses.length > 0) {
            try {
              const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${topAddresses.slice(0, 15).join(',')}`, {
                headers: { 'Accept': 'application/json' },
              })
              if (pairsRes.ok) {
                const pairsJson = await pairsRes.json()
                topPairsData = (pairsJson.pairs || []).filter((p: any) => p.chainId === 'solana')
              }
            } catch {}
          }

          const totalVolume = topPairsData.reduce((sum: number, p: any) => sum + (p.volume?.h1 ?? 0), 0)

          const { error: metaErr } = await supabase.from('arena_markets').insert({
            token_address: null,
            token_name: 'DexScreener Meta',
            token_symbol: 'META',
            chain: 'solana',
            market_type: 'meta',
            question: metaTemplate.question(),
            description: metaTemplate.description(timeframeStr),
            narrative: null,
            price_at_creation: null,
            resolve_at: resolveAt,
            status: 'active',
            bot_predictions: {},
            market_data: {
              metric: metaTemplate.metric,
              snapshot_leader: solanaTop10[0]?.tokenAddress ?? null,
              snapshot_leader_symbol: solanaTop10[0]?.symbol ?? null,
              snapshot_top10_addresses: solanaTop10.map((t: any) => t.tokenAddress),
              snapshot_top10_symbols: solanaTop10.map((t: any) => t.symbol ?? 'UNKNOWN'),
              snapshot_total_volume: totalVolume,
            },
          })

          if (!metaErr) {
            console.log(`  🌐 Created meta market: ${metaTemplate.metric}`)
            created++
          }
        }
      }
    } catch (err) {
      console.error('Meta market creation error:', err)
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

  const FORCE_CANCEL_THRESHOLD_MS = 6 * 60 * 60 * 1000 // 6 hours

  for (const market of markets) {
    const overdueMs = Date.now() - new Date(market.resolve_at).getTime()
    try {
      const mType = market.market_type
      const mData = market.market_data || {}
      let outcome: 'yes' | 'no' = 'no'
      let priceAtResolution: number | null = null

      // ── SINGLE-TOKEN MARKETS (up_down, rug_call, moonshot, culture) ──
      if (['up_down', 'rug_call', 'moonshot', 'culture'].includes(mType)) {
        let pair: any = null
        try {
          pair = await dex.getTokenByAddress(market.token_address)
        } catch (fetchErr) {
          console.error(`DexScreener fetch failed for ${market.token_symbol} (${market.id}):`, fetchErr)
        }
        const currentPrice = pair ? parseFloat(pair.priceUsd || '0') : 0
        priceAtResolution = currentPrice

        if (currentPrice <= 0) {
          if (overdueMs > FORCE_CANCEL_THRESHOLD_MS) {
            console.log(`⏰ Force-cancelling stuck market ${market.token_symbol} (${market.id}) — overdue ${Math.round(overdueMs / 3600000)}h, price unavailable`)
          }
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }

        // Rug Shield (skip for rug_call)
        if (mType !== 'rug_call') {
          const creationPriceCheck = parseFloat(market.price_at_creation || '0')
          if (creationPriceCheck > 0) {
            const priceChange = (currentPrice - creationPriceCheck) / creationPriceCheck
            if (priceChange <= -0.8) {
              console.log(`🛡️ Rug Shield: ${market.token_symbol} dropped ${Math.round(priceChange * 100)}%, cancelling market ${market.id}`)
              await cancelMarket(supabase, market)
              cancelled++
              continue
            }
          }
        }

        const creationPrice = parseFloat(market.price_at_creation || '0')

        switch (mType) {
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
            const q = market.question.toLowerCase()
            const thresholdMatch = market.question.match(/(\d+)%\+?/)
            if (q.includes('double')) {
              outcome = currentPrice >= creationPrice * 2 ? 'yes' : 'no'
            } else if (thresholdMatch) {
              const threshold = parseInt(thresholdMatch[1]) / 100
              outcome = currentPrice >= creationPrice * (1 + threshold) ? 'yes' : 'no'
            } else if (q.includes('staying power') || q.includes('holds above') || q.includes('hold above')) {
              outcome = currentPrice >= creationPrice ? 'yes' : 'no'
            } else {
              outcome = currentPrice > creationPrice ? 'yes' : 'no'
            }
            break
          }
        }
      }

      // ── VERSUS MARKETS: Relative % change ──
      else if (mType === 'versus') {
        const tokenB = mData.token_b
        if (!tokenB?.address || !market.token_address) {
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }

        const [pairA, pairB] = await Promise.all([
          dex.getTokenByAddress(market.token_address),
          dex.getTokenByAddress(tokenB.address),
        ])

        const priceA = pairA ? parseFloat(pairA.priceUsd || '0') : 0
        const priceB = pairB ? parseFloat(pairB.priceUsd || '0') : 0

        if (priceA <= 0 || priceB <= 0) {
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }

        priceAtResolution = priceA
        const creationA = parseFloat(market.price_at_creation || '0')
        const creationB = parseFloat(tokenB.price_at_creation || '0')

        // Rug Shield: if either drops 80%+, cancel
        if (creationA > 0 && creationB > 0) {
          const changeA = (priceA - creationA) / creationA
          const changeB = (priceB - creationB) / creationB
          if (changeA <= -0.8 || changeB <= -0.8) {
            console.log(`🛡️ Rug Shield (versus): Token rugged, cancelling market ${market.id}`)
            await cancelMarket(supabase, market)
            cancelled++
            continue
          }
        }

        // Relative performance: YES = token A wins, NO = token B wins
        const pctChangeA = creationA > 0 ? (priceA - creationA) / creationA : 0
        const pctChangeB = creationB > 0 ? (priceB - creationB) / creationB : 0
        outcome = pctChangeA >= pctChangeB ? 'yes' : 'no'

        // Store token B resolution price in market_data
        mData.token_b.price_at_resolution = priceB
      }

      // ── NARRATIVE INDEX MARKETS: Average % change of basket ──
      else if (mType === 'narrative_index') {
        const tokens = mData.tokens || []
        const threshold = mData.threshold_pct || 5

        if (tokens.length === 0) {
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }

        let totalPctChange = 0
        let validCount = 0
        let rugCount = 0

        for (const token of tokens) {
          try {
            const pair = await dex.getTokenByAddress(token.address)
            const currentPrice = pair ? parseFloat(pair.priceUsd || '0') : 0
            const creationPrice = parseFloat(token.price_at_creation || '0')

            if (currentPrice <= 0 || creationPrice <= 0) continue

            const pctChange = ((currentPrice - creationPrice) / creationPrice) * 100
            // If individual token rugged (80%+), exclude it (treat as 0% — don't punish the basket)
            if (pctChange <= -80) {
              rugCount++
              token.price_at_resolution = currentPrice
              continue
            }

            totalPctChange += pctChange
            validCount++
            token.price_at_resolution = currentPrice
          } catch {}
        }

        // If 50%+ of basket rugged, cancel the market
        if (rugCount >= tokens.length / 2) {
          console.log(`🛡️ Rug Shield (index): ${rugCount}/${tokens.length} tokens rugged, cancelling market ${market.id}`)
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }

        const avgPctChange = validCount > 0 ? totalPctChange / validCount : 0
        outcome = avgPctChange >= threshold ? 'yes' : 'no'
      }

      // ── CULTURE-CRYPTO HYBRID MARKETS ──
      else if (mType === 'culture_crypto') {
        const metric = mData.metric
        const snapshotTokens = mData.snapshot_tokens || []
        const narrative = mData.narrative

        try {
          switch (metric) {
            case 'market_cap_threshold': {
              // Did any token in this narrative cross $1M market cap?
              const mcThreshold = mData.market_cap_threshold || 1000000
              let crossed = false

              // Check snapshot tokens first
              for (const token of snapshotTokens) {
                try {
                  const pair = await dex.getTokenByAddress(token.address)
                  if (pair) {
                    const mc = (pair as any).marketCap ?? pair.fdv ?? 0
                    if (mc >= mcThreshold) { crossed = true; break }
                  }
                } catch {}
              }

              // Also check if new tokens in this narrative crossed the threshold
              if (!crossed && narrative) {
                const trendingRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
                  headers: { 'Accept': 'application/json' },
                })
                if (trendingRes.ok) {
                  const tokens = await trendingRes.json()
                  const narrativeTokens = (tokens || []).filter((t: any) => {
                    if (t.chainId !== 'solana') return false
                    const detected = detectNarrative(t.symbol || '', t.name || '')
                    return detected === narrative
                  })

                  for (const t of narrativeTokens.slice(0, 5)) {
                    try {
                      const pair = await dex.getTokenByAddress(t.tokenAddress)
                      if (pair) {
                        const mc = (pair as any).marketCap ?? pair.fdv ?? 0
                        if (mc >= mcThreshold) { crossed = true; break }
                      }
                    } catch {}
                  }
                }
              }

              outcome = crossed ? 'yes' : 'no'
              break
            }

            case 'new_entrant_count': {
              // Did a new token from this narrative enter DexScreener trending?
              const snapshotAddresses = new Set(snapshotTokens.map((t: any) => t.address))
              let newEntrant = false

              const trendingRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
                headers: { 'Accept': 'application/json' },
              })
              if (trendingRes.ok) {
                const tokens = await trendingRes.json()
                for (const t of (tokens || [])) {
                  if (t.chainId !== 'solana') continue
                  if (snapshotAddresses.has(t.tokenAddress)) continue
                  const detected = detectNarrative(t.symbol || '', t.name || '')
                  if (detected === narrative) { newEntrant = true; break }
                }
              }

              outcome = newEntrant ? 'yes' : 'no'
              break
            }

            case 'volume_spike': {
              // Did total volume of narrative tokens 2x?
              const snapshotVolume = mData.snapshot_total_volume || 0
              if (snapshotVolume <= 0) { outcome = 'no'; break }

              let currentVolume = 0
              for (const token of snapshotTokens) {
                try {
                  const pair = await dex.getTokenByAddress(token.address)
                  if (pair) currentVolume += (pair.volume?.h1 ?? 0)
                } catch {}
              }

              outcome = currentVolume >= snapshotVolume * 2 ? 'yes' : 'no'
              break
            }

            default:
              outcome = 'no'
          }
        } catch (err) {
          console.error(`Culture-crypto resolution error for ${market.id}:`, err)
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }
      }

      // ── META / ECOSYSTEM MARKETS ──
      else if (mType === 'meta') {
        const metric = mData.metric

        try {
          const trendingRes = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
            headers: { 'Accept': 'application/json' },
          })

          if (!trendingRes.ok) {
            await cancelMarket(supabase, market)
            cancelled++
            continue
          }

          const trendingTokens = await trendingRes.json()
          const solanaTop10 = (trendingTokens || [])
            .filter((t: any) => t.chainId === 'solana')
            .slice(0, 10)

          switch (metric) {
            case 'trending_leader_change': {
              const snapshotLeader = mData.snapshot_leader
              const currentLeader = solanaTop10[0]?.tokenAddress ?? null
              outcome = (currentLeader && currentLeader !== snapshotLeader) ? 'yes' : 'no'
              break
            }

            case 'new_top10': {
              const snapshotAddresses = new Set(mData.snapshot_top10_addresses || [])
              const hasNewToken = solanaTop10.some((t: any) => !snapshotAddresses.has(t.tokenAddress))
              outcome = hasNewToken ? 'yes' : 'no'
              break
            }

            case 'volume_increase': {
              const snapshotVolume = mData.snapshot_total_volume || 0
              if (snapshotVolume <= 0) { outcome = 'no'; break }

              const topAddresses = solanaTop10.map((t: any) => t.tokenAddress).filter(Boolean)
              let currentVolume = 0
              if (topAddresses.length > 0) {
                try {
                  const pairsRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${topAddresses.slice(0, 15).join(',')}`, {
                    headers: { 'Accept': 'application/json' },
                  })
                  if (pairsRes.ok) {
                    const pairsJson = await pairsRes.json()
                    const pairs = (pairsJson.pairs || []).filter((p: any) => p.chainId === 'solana')
                    currentVolume = pairs.reduce((sum: number, p: any) => sum + (p.volume?.h1 ?? 0), 0)
                  }
                } catch {}
              }

              outcome = currentVolume >= snapshotVolume * 1.5 ? 'yes' : 'no'
              break
            }

            default:
              outcome = 'no'
          }
        } catch (err) {
          console.error(`Meta resolution error for ${market.id}:`, err)
          await cancelMarket(supabase, market)
          cancelled++
          continue
        }
      }

      // ── Unknown market type — cancel ──
      else {
        await cancelMarket(supabase, market)
        cancelled++
        continue
      }

      // Update market with resolution
      await supabase.from('arena_markets').update({
        status: 'resolved',
        outcome,
        price_at_resolution: priceAtResolution,
        resolved_at: now,
        market_data: mData, // Save updated market_data (e.g., token_b resolution price)
      }).eq('id', market.id)

      // Calculate payouts
      await distributePayouts(supabase, market, outcome)
      resolved++
    } catch (err) {
      console.error(`Error resolving market ${market.id}:`, err)
      // If the market has been stuck for 6+ hours and keeps erroring, force-cancel it
      if (overdueMs > FORCE_CANCEL_THRESHOLD_MS) {
        try {
          console.log(`⏰ Force-cancelling erroring market ${market.token_symbol} (${market.id}) — overdue ${Math.round(overdueMs / 3600000)}h`)
          await cancelMarket(supabase, market)
          cancelled++
        } catch (cancelErr) {
          console.error(`Failed to force-cancel market ${market.id}:`, cancelErr)
          errors++
        }
      } else {
        errors++
      }
    }
  }

  return { resolved, cancelled, errors }
}

/**
 * Distribute points to winners from a resolved market.
 * Pari-mutuel style: losers' pool is distributed to winners proportionally.
 * Uses atomic RPC functions to prevent race conditions.
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
  const loserBets = bets.filter(b => b.position !== outcome)
  const loserPool = loserBets.reduce((sum, b) => sum + b.amount, 0)
  const winnerPool = winnerBets.reduce((sum, b) => sum + b.amount, 0)

  // If no winners, everyone predicted wrong — apply solo penalty
  // Refund stake minus penalty (capped so they never lose more than they wagered)
  if (winnerBets.length === 0) {
    for (const bet of bets) {
      const payout = Math.max(bet.amount - SOLO_MARKET_BONUS, 0)
      await supabase.rpc('credit_arena_points', {
        p_user_id: bet.user_id,
        p_amount: payout,
        p_is_win: false,
      })
      await supabase.from('arena_bets').update({ payout, is_winner: false }).eq('id', bet.id)
      await supabase.rpc('update_arena_streak', {
        p_user_id: bet.user_id,
        p_is_win: false,
      })
    }
    return
  }

  // If no losers, everyone predicted right — apply solo bonus
  // Refund stake plus bonus reward
  if (loserPool === 0) {
    for (const bet of winnerBets) {
      const payout = bet.amount + SOLO_MARKET_BONUS
      await supabase.from('arena_bets').update({ payout, is_winner: true }).eq('id', bet.id)
      await supabase.rpc('credit_arena_points', {
        p_user_id: bet.user_id,
        p_amount: payout,
        p_is_win: true,
      })
    }
    // Mark losers (shouldn't exist if loserPool is 0, but defensive)
    for (const bet of loserBets) {
      await supabase.from('arena_bets').update({ payout: 0, is_winner: false }).eq('id', bet.id)
      await supabase.rpc('update_arena_streak', {
        p_user_id: bet.user_id,
        p_is_win: false,
      })
    }
    return
  }

  // Pari-mutuel distribution
  for (const bet of winnerBets) {
    const share = bet.amount / winnerPool
    const payout = Math.round(bet.amount + (loserPool * share))

    await supabase.from('arena_bets').update({ payout, is_winner: true }).eq('id', bet.id)
    await supabase.rpc('credit_arena_points', {
      p_user_id: bet.user_id,
      p_amount: payout,
      p_is_win: true,
    })
  }

  // Mark losers and update their streaks
  for (const bet of loserBets) {
    await supabase.from('arena_bets').update({ payout: 0, is_winner: false }).eq('id', bet.id)
    await supabase.rpc('update_arena_streak', {
      p_user_id: bet.user_id,
      p_is_win: false,
    })
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
      // Mark bet as refunded (not a win or loss)
      await supabase.from('arena_bets').update({
        payout: bet.amount,
        is_winner: null,
      }).eq('id', bet.id)

      // Refund points atomically
      await supabase.rpc('credit_arena_points', {
        p_user_id: bet.user_id,
        p_amount: bet.amount,
        p_is_win: false,
      })
    }
  }
}

// Note: creditPoints and updateStreak are now handled by atomic RPC functions
// (credit_arena_points and update_arena_streak) defined in migration 021.
// This eliminates race conditions from the read-then-write pattern.

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
