import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { UpdateFormulaInput, Formula, ApiResponse } from '@/types/database'

// GET /api/formulas/[id] - Get a single formula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const { data, error } = await supabase
    .from('formulas')
    .select('*, profile:profiles(*)')
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: error.code === 'PGRST116' ? 404 : 500 })
  }
  
  // Check if user has access (owner or public formula)
  if (!data.is_public && data.user_id !== session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Formula not found' 
    }, { status: 404 })
  }
  
  return NextResponse.json<ApiResponse<Formula>>({ 
    data: data as Formula 
  })
}

// PATCH /api/formulas/[id] - Update a formula
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  try {
    const body: UpdateFormulaInput = await request.json()
    
    // First, verify ownership
    const { data: existing } = await supabase
      .from('formulas')
      .select('user_id')
      .eq('id', params.id)
      .single()
    
    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'Formula not found or unauthorized' 
      }, { status: 404 })
    }
    
    // Update formula
    const updateData: Record<string, unknown> = {}
    
    // Basic fields
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.is_public !== undefined) updateData.is_public = body.is_public
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.liquidity_min !== undefined) updateData.liquidity_min = body.liquidity_min
    if (body.liquidity_max !== undefined) updateData.liquidity_max = body.liquidity_max
    if (body.volume_24h_min !== undefined) updateData.volume_24h_min = body.volume_24h_min
    if (body.volume_24h_spike !== undefined) updateData.volume_24h_spike = body.volume_24h_spike
    if (body.holders_min !== undefined) updateData.holders_min = body.holders_min
    if (body.holders_max !== undefined) updateData.holders_max = body.holders_max
    if (body.token_age_max_hours !== undefined) updateData.token_age_max_hours = body.token_age_max_hours
    if (body.require_verified_contract !== undefined) updateData.require_verified_contract = body.require_verified_contract
    if (body.require_honeypot_check !== undefined) updateData.require_honeypot_check = body.require_honeypot_check
    if (body.require_liquidity_lock !== undefined) updateData.require_liquidity_lock = body.require_liquidity_lock
    
    // Enhanced parameters
    if (body.token_age_min_minutes !== undefined) updateData.token_age_min_minutes = body.token_age_min_minutes
    if (body.buy_sell_ratio_1h_min !== undefined) updateData.buy_sell_ratio_1h_min = body.buy_sell_ratio_1h_min
    if (body.tx_count_1h_min !== undefined) updateData.tx_count_1h_min = body.tx_count_1h_min
    if (body.tx_count_24h_min !== undefined) updateData.tx_count_24h_min = body.tx_count_24h_min
    if (body.fdv_min !== undefined) updateData.fdv_min = body.fdv_min
    if (body.fdv_max !== undefined) updateData.fdv_max = body.fdv_max
    if (body.price_change_1h_min !== undefined) updateData.price_change_1h_min = body.price_change_1h_min
    if (body.price_change_1h_max !== undefined) updateData.price_change_1h_max = body.price_change_1h_max
    if (body.price_change_6h_min !== undefined) updateData.price_change_6h_min = body.price_change_6h_min
    if (body.price_change_6h_max !== undefined) updateData.price_change_6h_max = body.price_change_6h_max
    if (body.price_change_24h_min !== undefined) updateData.price_change_24h_min = body.price_change_24h_min
    if (body.price_change_24h_max !== undefined) updateData.price_change_24h_max = body.price_change_24h_max
    if (body.volume_1h_vs_6h_spike !== undefined) updateData.volume_1h_vs_6h_spike = body.volume_1h_vs_6h_spike
    if (body.volume_6h_vs_24h_spike !== undefined) updateData.volume_6h_vs_24h_spike = body.volume_6h_vs_24h_spike
    
    // RugCheck safety
    if (body.require_rugcheck !== undefined) updateData.require_rugcheck = body.require_rugcheck
    if (body.rugcheck_min_score !== undefined) updateData.rugcheck_min_score = body.rugcheck_min_score
    
    // Social momentum (Galaxy Score)
    if (body.require_galaxy_score !== undefined) updateData.require_galaxy_score = body.require_galaxy_score
    if (body.galaxy_score_min !== undefined) updateData.galaxy_score_min = body.galaxy_score_min
    
    const { data, error } = await supabase
      .from('formulas')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<Formula>>({ 
      data: data as Formula,
      message: 'Formula updated successfully'
    })
    
  } catch (e) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Invalid request body' 
    }, { status: 400 })
  }
}

// DELETE /api/formulas/[id] - Delete a formula
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  // First, verify ownership
  const { data: existing } = await supabase
    .from('formulas')
    .select('user_id')
    .eq('id', params.id)
    .single()
  
  if (!existing || existing.user_id !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Formula not found or unauthorized' 
    }, { status: 404 })
  }
  
  const { error } = await supabase
    .from('formulas')
    .delete()
    .eq('id', params.id)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<null>>({ 
    message: 'Formula deleted successfully'
  })
}
