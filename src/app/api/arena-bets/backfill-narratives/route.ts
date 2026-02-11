import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { detectNarrative } from '@/lib/services/arena-bets'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Detect narrative from market question/description text when token detection fails
function detectNarrativeFromQuestion(question: string): string | null {
  const q = question.toLowerCase()
  if (/\bct\b|crypto.?twitter|memecoin|breakout memecoin|meta rotation|staying power|go viral|hype/.test(q)) return 'ct'
  if (/influencer|celebrity|famous/.test(q)) return 'celebrity'
  if (/trump|biden|maga|politic|election/.test(q)) return 'political'
  if (/super.?bowl|nfl|nba|championship/.test(q)) return 'super_bowl'
  if (/christmas|halloween|valentine|easter|holiday|new.?year|thanksgiv|4th.?of.?july|seasonal|festival|grammy|oscar|coachella/.test(q)) return 'seasonal'
  return null
}

// POST /api/arena-bets/backfill-narratives
// Re-detect narratives on all existing markets using token symbol/name,
// then fall back to question text analysis. Safe to run multiple times.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  const { data: markets, error } = await supabase
    .from('arena_markets')
    .select('id, token_symbol, token_name, narrative, question')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let updated = 0
  let unchanged = 0
  const changes: { id: string; symbol: string; from: string | null; to: string | null }[] = []

  for (const market of markets || []) {
    // Priority: token detection > question text detection
    const detected = detectNarrative(market.token_symbol || '', market.token_name || '')
      || detectNarrativeFromQuestion(market.question || '')

    // Skip if narrative is already correct
    if (detected === market.narrative) {
      unchanged++
      continue
    }

    // Don't overwrite a specific narrative with null
    if (!detected && market.narrative && market.narrative !== 'trending') {
      unchanged++
      continue
    }

    // Update 'trending' → detected, or null → detected
    if (detected && (!market.narrative || market.narrative === 'trending')) {
      const { error: updateErr } = await supabase
        .from('arena_markets')
        .update({ narrative: detected })
        .eq('id', market.id)

      if (!updateErr) {
        updated++
        changes.push({
          id: market.id,
          symbol: market.token_symbol,
          from: market.narrative,
          to: detected,
        })
      }
    } else {
      unchanged++
    }
  }

  return NextResponse.json({
    success: true,
    total: markets?.length || 0,
    updated,
    unchanged,
    changes: changes.slice(0, 50),
  })
}
