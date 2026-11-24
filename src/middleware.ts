import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/account/:path*'],
}

// Cookie presence only. This is not authentication: every route handler and the
// admin layout validate the session and role server-side (see src/lib/auth/session.ts).
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public admin login page. Pass the pathname on so the admin layout can skip its gate here.
  if (pathname === '/admin/login' || pathname === '/admin/login/') {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', '/admin/login')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // getSessionCookie also checks the __Secure- prefixed name used over HTTPS.
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }
    const isAdmin = pathname.startsWith('/admin')
    const target = isAdmin ? new URL('/admin/login', request.url) : new URL('/', request.url)
    if (isAdmin) target.searchParams.set('redirect', pathname)
    return NextResponse.redirect(target)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  return NextResponse.next({ request: { headers: requestHeaders } })
}
