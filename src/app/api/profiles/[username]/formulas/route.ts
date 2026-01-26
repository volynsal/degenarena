import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// GET /api/profiles/[username]/formulas - Get user's public formulas
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  
  // Get user
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', params.username)
    .single()
  
  if (userError || !user) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'User not found'
    }, { status: 404 })
  }
  
  // Get public formulas
  const { data: formulas, error } = await supabase
    .from('formulas')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_public', true)
    .order('win_rate', { ascending: false })
  
  if (error) {
    return NextResponse.json<ApiResponse<null>>({
      error: error.message
    }, { status: 500 })
  }
  
  return NextResponse.json<ApiResponse<typeof formulas>>({
    data: formulas
  })
}
