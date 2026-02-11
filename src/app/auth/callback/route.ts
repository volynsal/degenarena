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
      // then waits for the cookie to actually be readable before redirecting.
      // This prevents the race condition where the redirect fires before
      // the browser has persisted the Set-Cookie headers.
      const html = `<!DOCTYPE html><html><head>
<script>
(function() {
  var dest = "${redirect}";
  var maxWait = 3000;
  var start = Date.now();
  function check() {
    // Check if Supabase auth cookie is readable yet
    if (document.cookie.indexOf("sb-") !== -1) {
      window.location.href = dest;
    } else if (Date.now() - start > maxWait) {
      // Fallback: redirect anyway after 3s
      window.location.href = dest;
    } else {
      setTimeout(check, 100);
    }
  }
  // Start checking after a small initial delay
  setTimeout(check, 200);
})();
</script>
<noscript><meta http-equiv="refresh" content="3;url=${redirect}"></noscript>
</head><body>Redirecting...</body></html>`
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
