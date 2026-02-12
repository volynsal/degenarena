import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** GET /api/admin/markets?q=PATRIOTS — Search markets (admin only) */
export async function GET(request: NextRequest) {
  // Verify admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = getServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ markets: [] })

  // Search by token symbol or question text
  const { data: markets, error } = await service
    .from('arena_markets')
    .select('id, question, status, outcome, token_symbol, price_at_creation, price_at_resolution, resolve_at, resolved_at, total_pool, total_bettors, market_data')
    .or(`token_symbol.ilike.%${q}%,question.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: 'Search failed', details: error }, { status: 500 })
  }

  return NextResponse.json({ markets: markets || [] })
}
