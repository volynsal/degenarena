import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// POST /api/community/[id]/upvote - Toggle upvote on a formula
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Unauthorized'
    }, { status: 401 })
  }
  
  const formulaId = params.id
  const userId = session.user.id
  
  // Check if formula exists and is public
  const { data: formula, error: formulaError } = await supabase
    .from('formulas')
    .select('id, is_public, user_id')
    .eq('id', formulaId)
    .single()
  
  if (formulaError || !formula) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Formula not found'
    }, { status: 404 })
  }
  
  if (!formula.is_public) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Cannot upvote private formula'
    }, { status: 400 })
  }
  
  // Can't upvote your own formula
  if (formula.user_id === userId) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Cannot upvote your own formula'
    }, { status: 400 })
  }
  
  // Check if already upvoted
  const { data: existingUpvote } = await supabase
    .from('formula_upvotes')
    .select('id')
    .eq('formula_id', formulaId)
    .eq('user_id', userId)
    .single()
  
  if (existingUpvote) {
    // Remove upvote
    const { error: deleteError } = await supabase
      .from('formula_upvotes')
      .delete()
      .eq('formula_id', formulaId)
      .eq('user_id', userId)
    
    if (deleteError) {
      return NextResponse.json<ApiResponse<null>>({
        error: deleteError.message
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ upvoted: boolean }>>({
      data: { upvoted: false }
    })
  } else {
    // Add upvote
    const { error: insertError } = await supabase
      .from('formula_upvotes')
      .insert({
        formula_id: formulaId,
        user_id: userId,
      })
    
    if (insertError) {
      return NextResponse.json<ApiResponse<null>>({
        error: insertError.message
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ upvoted: boolean }>>({
      data: { upvoted: true }
    })
  }
}
