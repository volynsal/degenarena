import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { CompetitionEntry, ApiResponse } from '@/types/database'

// POST /api/competitions/[id]/enter - Enter a competition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  // Get request body
  const body = await request.json()
  const { formula_id } = body
  
  if (!formula_id) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'formula_id is required' 
    }, { status: 400 })
  }
  
  // Get competition
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (compError || !competition) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition not found' 
    }, { status: 404 })
  }
  
  // Check if competition is open for entries
  const now = new Date()
  const startsAt = new Date(competition.starts_at)
  const endsAt = new Date(competition.ends_at)
  
  if (competition.status === 'completed' || competition.status === 'cancelled') {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition is no longer accepting entries' 
    }, { status: 400 })
  }
  
  if (now > endsAt) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition has ended' 
    }, { status: 400 })
  }
  
  // Check max participants
  if (competition.max_participants && competition.participant_count >= competition.max_participants) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition is full' 
    }, { status: 400 })
  }
  
  // Verify formula belongs to user
  const { data: formula, error: formulaError } = await supabase
    .from('formulas')
    .select('*')
    .eq('id', formula_id)
    .eq('user_id', user.id)
    .single()
  
  if (formulaError || !formula) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Formula not found or does not belong to you' 
    }, { status: 400 })
  }
  
  // Check if user already entered (if multiple formulas not allowed)
  if (!competition.allow_multiple_formulas) {
    const { data: existingEntry } = await supabase
      .from('competition_entries')
      .select('id')
      .eq('competition_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (existingEntry) {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'You have already entered this competition' 
      }, { status: 400 })
    }
  }
  
  // Create snapshot of formula parameters if required
  let formulaSnapshot = null
  if (competition.formula_snapshot) {
    const { id: _, user_id: __, created_at: ___, updated_at: ____, ...params } = formula
    formulaSnapshot = params
  }
  
  // Create entry
  const { data: entry, error: entryError } = await supabase
    .from('competition_entries')
    .insert({
      competition_id: id,
      user_id: user.id,
      formula_id: formula_id,
      formula_snapshot: formulaSnapshot,
    })
    .select()
    .single()
  
  if (entryError) {
    // Check for duplicate entry
    if (entryError.code === '23505') {
      return NextResponse.json<ApiResponse<null>>({ 
        error: 'You have already entered this formula in this competition' 
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse<null>>({ 
      error: entryError.message 
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<CompetitionEntry>>({ 
    data: entry as CompetitionEntry,
    message: 'Successfully entered competition!'
  })
}

// DELETE /api/competitions/[id]/enter - Withdraw from competition
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }
  
  // Get competition to check if withdrawal is allowed
  const { data: competition } = await supabase
    .from('competitions')
    .select('status, starts_at')
    .eq('id', id)
    .single()
  
  if (!competition) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Competition not found' 
    }, { status: 404 })
  }
  
  // Only allow withdrawal before competition starts
  const now = new Date()
  const startsAt = new Date(competition.starts_at)
  
  if (now >= startsAt) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: 'Cannot withdraw after competition has started' 
    }, { status: 400 })
  }
  
  // Delete entry
  const { error } = await supabase
    .from('competition_entries')
    .delete()
    .eq('competition_id', id)
    .eq('user_id', user.id)
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({ 
      error: error.message 
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<null>>({ 
    message: 'Successfully withdrawn from competition' 
  })
}
