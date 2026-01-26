import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Formula, ApiResponse } from '@/types/database'

// POST /api/formulas/[id]/copy - Copy a public formula
export async function POST(
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
  
  // Get the original formula
  const { data: original, error: fetchError } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (fetchError || !original) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Formula not found' 
    }, { status: 404 })
  }
  
  // Check if formula is public or owned by user
  if (!original.is_public && original.user_id !== session.user.id) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Cannot copy private formula' 
    }, { status: 403 })
  }
  
  // Get original owner's username for attribution
  const { data: originalProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', original.user_id)
    .single()
  
  // Create the copy
  const { data: copiedFormula, error: insertError } = await supabase
    .from('formulas')
    .insert({
      user_id: session.user.id,
      name: `${original.name} (Copy)`,
      description: original.description 
        ? `${original.description}\n\nCopied from @${originalProfile?.username || 'unknown'}'s formula`
        : `Copied from @${originalProfile?.username || 'unknown'}'s formula`,
      is_public: false, // Copies start as private
      is_active: false, // Start inactive
      liquidity_min: original.liquidity_min,
      liquidity_max: original.liquidity_max,
      volume_24h_min: original.volume_24h_min,
      volume_24h_spike: original.volume_24h_spike,
      holders_min: original.holders_min,
      holders_max: original.holders_max,
      token_age_max_hours: original.token_age_max_hours,
      require_verified_contract: original.require_verified_contract,
      require_honeypot_check: original.require_honeypot_check,
      require_liquidity_lock: original.require_liquidity_lock,
    })
    .select()
    .single()
  
  if (insertError) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: insertError.message 
    }, { status: 500 })
  }
  
  // Record the copy
  await supabase
    .from('formula_copies')
    .insert({
      original_formula_id: params.id,
      copied_formula_id: copiedFormula.id,
      copied_by: session.user.id,
    })
  
  return NextResponse.json<ApiResponse<Formula>>({ 
    data: copiedFormula as Formula,
    message: 'Formula copied successfully'
  }, { status: 201 })
}
