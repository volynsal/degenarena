import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/dashboard'

  if (code) {
    // Collect cookies during session exchange, apply to response after
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
      // Return an HTML page that sets cookies via Set-Cookie headers,
      // then redirects client-side. This avoids the browser dropping
      // cookies during 302 redirect chains (common auth bug).
      const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirect}"><script>window.location.href="${redirect}"</script></head><body></body></html>`
      const response = new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      })
      for (const cookie of cookiesToSet) {
        response.cookies.set({ name: cookie.name, value: cookie.value, ...cookie.options })
      }
      return response
    }
  }

  // Return to login page if there's an error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
