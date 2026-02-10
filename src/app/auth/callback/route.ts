import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    // Collect cookies during session exchange, apply to redirect after
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookiesToSet.push({ name, value, options })
          },
          remove(name: string, options: CookieOptions) {
            cookiesToSet.push({ name, value: '', options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Create redirect and attach ALL session cookies
      const response = NextResponse.redirect(`${origin}${redirect}`)
      for (const cookie of cookiesToSet) {
        response.cookies.set({ name: cookie.name, value: cookie.value, ...cookie.options })
      }
      return response
    }
  }

  // Return to login page if there's an error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
