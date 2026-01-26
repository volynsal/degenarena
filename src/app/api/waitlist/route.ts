import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/database'

// Use admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/waitlist - Join waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, referral_source } = body
    
    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiResponse<null>>({
        error: 'Valid email is required'
      }, { status: 400 })
    }
    
    // Check if already on waitlist
    const { data: existing } = await supabaseAdmin
      .from('waitlist')
      .select('id, status')
      .eq('email', email.toLowerCase().trim())
      .single()
    
    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json<ApiResponse<{ already_approved: boolean }>>({
          data: { already_approved: true },
          message: 'You\'ve already been approved! Check your email for the signup link.'
        })
      }
      return NextResponse.json<ApiResponse<{ already_exists: boolean }>>({
        data: { already_exists: true },
        message: 'You\'re already on the waitlist!'
      })
    }
    
    // Add to waitlist
    const { error } = await supabaseAdmin
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        referral_source: referral_source || null,
      })
    
    if (error) {
      console.error('Waitlist insert error:', error)
      return NextResponse.json<ApiResponse<null>>({
        error: 'Failed to join waitlist'
      }, { status: 500 })
    }
    
    return NextResponse.json<ApiResponse<{ joined: boolean }>>({
      data: { joined: true },
      message: 'You\'re on the list! We\'ll email you when it\'s your turn.'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json<ApiResponse<null>>({
      error: 'Something went wrong'
    }, { status: 500 })
  }
}

// GET /api/waitlist?email=xxx - Check waitlist status (for signup page)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json<ApiResponse<null>>({
      error: 'Email required'
    }, { status: 400 })
  }
  
  const { data: entry, error } = await supabaseAdmin
    .from('waitlist')
    .select('id, status')
    .eq('email', email.toLowerCase().trim())
    .single()
  
  if (error || !entry) {
    return NextResponse.json<ApiResponse<{ status: string }>>({
      data: { status: 'not_found' }
    })
  }
  
  return NextResponse.json<ApiResponse<{ status: string }>>({
    data: { status: entry.status }
  })
}
