import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** GET /api/admin/check — Check if the current user is an admin */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ is_admin: false }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ is_admin: profile?.is_admin === true })
}
