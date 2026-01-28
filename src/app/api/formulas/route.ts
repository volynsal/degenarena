import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CreateFormulaInput, Formula, ApiResponse, PaginatedResponse } from '@/types/database'

// GET /api/formulas - Get user's formulas or public formulas
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const publicOnly = searchParams.get('public') === 'true'
  const offset = (page - 1) * pageSize
  
  const { data: { session } } = await supabase.auth.getSession()
  
  let query = supabase
    .from('formulas')
    .select('*, profile:profiles(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)
  
  if (publicOnly) {
    // Get public formulas (for leaderboard/discovery)
    query = query.eq('is_public', true)
  } else if (session?.user) {
    // Get user's own formulas
    query = query.eq('user_id', session.user.id)
  } else {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  const { data, error, count } = await query
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  const response: PaginatedResponse<Formula> = {
    data: data as Formula[],
    total: count || 0,
    page,
    pageSize,
    hasMore: (offset + pageSize) < (count || 0)
  }
  
  return NextResponse.json(response)
}

// POST /api/formulas - Create a new formula
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  try {
    const body: CreateFormulaInput = await request.json()
    
    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Formula name is required' 
      }, { status: 400 })
    }
    
    // Create formula
    const { data, error } = await supabase
      .from('formulas')
      .insert({
        user_id: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        is_public: body.is_public ?? false,
        is_active: body.is_active ?? true,
        // Basic parameters
        liquidity_min: body.liquidity_min,
        liquidity_max: body.liquidity_max,
        volume_24h_min: body.volume_24h_min,
        volume_24h_spike: body.volume_24h_spike,
        holders_min: body.holders_min,
        holders_max: body.holders_max,
        token_age_max_hours: body.token_age_max_hours,
        require_verified_contract: body.require_verified_contract ?? true,
        require_honeypot_check: body.require_honeypot_check ?? true,
        require_liquidity_lock: body.require_liquidity_lock ?? false,
        // Enhanced parameters
        token_age_min_minutes: body.token_age_min_minutes,
        buy_sell_ratio_1h_min: body.buy_sell_ratio_1h_min,
        tx_count_1h_min: body.tx_count_1h_min,
        tx_count_24h_min: body.tx_count_24h_min,
        fdv_min: body.fdv_min,
        fdv_max: body.fdv_max,
        price_change_1h_min: body.price_change_1h_min,
        price_change_1h_max: body.price_change_1h_max,
        price_change_6h_min: body.price_change_6h_min,
        price_change_6h_max: body.price_change_6h_max,
        price_change_24h_min: body.price_change_24h_min,
        price_change_24h_max: body.price_change_24h_max,
        volume_1h_vs_6h_spike: body.volume_1h_vs_6h_spike,
        volume_6h_vs_24h_spike: body.volume_6h_vs_24h_spike,
      })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<Formula>>({ 
      data: data as Formula,
      message: 'Formula created successfully'
    }, { status: 201 })
    
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Invalid request body' 
    }, { status: 400 })
  }
}
