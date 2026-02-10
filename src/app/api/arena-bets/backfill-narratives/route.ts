import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { detectNarrative } from '@/lib/services/arena-bets'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/arena-bets/backfill-narratives
// One-shot endpoint to re-detect narratives on all existing markets
// using the latest regex patterns. Safe to run multiple times.
export async function POST(request: NextRequest) {
  // Simple auth: require cron secret or service key
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  // Fetch all markets that have a token_symbol (we need it for detection)
  const { data: markets, error } = await supabase
    .from('arena_markets')
    .select('id, token_symbol, token_name, narrative')
    .not('token_symbol', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let updated = 0
  let unchanged = 0
  const changes: { id: string; symbol: string; from: string | null; to: string | null }[] = []

  for (const market of markets || []) {
    const detected = detectNarrative(market.token_symbol || '', market.token_name || '')

    // Update if: narrative changed, or was 'trending' and we now have something specific
    if (detected !== market.narrative) {
      // Don't overwrite a specific narrative with null
      if (!detected && market.narrative && market.narrative !== 'trending') {
        unchanged++
        continue
      }

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
    changes: changes.slice(0, 50), // Show first 50 changes
  })
}
