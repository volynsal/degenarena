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
