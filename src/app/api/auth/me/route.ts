import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { ApiResponse, Profile } from '@/types/database'

// Service role client to bypass RLS
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/auth/me - Get current user's profile
export async function GET() {
  const supabase = createClient()
  const serviceClient = getServiceClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Not authenticated'
    }, { status: 401 })
  }
  
  // Fetch profile with tier info
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
  
  if (error || !profile) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Profile not found'
    }, { status: 404 })
  }
  
  return NextResponse.json<ApiResponse<Profile>>({
    data: {
      ...profile,
      subscription_tier: profile.subscription_tier || 'free',
      badges: profile.badges || [],
    }
  })
}
