import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { buildSecurityHeaders } from '@/lib/security-headers.mjs'

// Runs on every page and API request (not static assets) so that client-supplied identity headers
// are always dropped. Only /admin, /api/admin and /account are gated.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?|txt|xml)$).*)'],
}

// Identity must only ever come from the verified Better Auth session inside route handlers.
// Strip every x-user-* header, plus x-pathname which this middleware sets itself.
function cleanHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers)
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith('x-user-') || name.toLowerCase() === 'x-pathname') headers.delete(name)
  }
  return headers
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const { key, value } of buildSecurityHeaders(process.env.R2_PUBLIC_HOST)) {
    response.headers.set(key, value)
  }
  return response
}

// Cookie presence only: a cheap gate. Validating the session needs a D1 round trip, which the
// edge middleware does not do. Every route handler and every admin page validates the session and
// role server-side (guardAdmin / assertAdminPage in src/lib/auth/session.ts).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = cleanHeaders(request)

  // Public admin login page. Pass the pathname on so the admin layout can skip its gate here.
  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    requestHeaders.set('x-pathname', '/admin/login')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const gated =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname.startsWith('/account')

  if (gated && !getSessionCookie(request)) {
    if (pathname.startsWith('/api/')) {
      return withSecurityHeaders(
        NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 })
      )
    }
    const isAdmin = pathname.startsWith('/admin')
    const target = isAdmin ? new URL('/admin/login', request.url) : new URL('/', request.url)
    if (isAdmin) target.searchParams.set('redirect', pathname)
    return withSecurityHeaders(NextResponse.redirect(target))
  }

  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}
