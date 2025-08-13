import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files, _next, favicon, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // static assets
  ) {
    return NextResponse.next()
  }

  // Allow auth pages
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next()
  }

  // Check for access token in cookies
  const accessToken = request.cookies.get('accessToken')?.value
  if (!accessToken) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/signin'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes - require root admin access
  if (pathname.startsWith('/admin')) {
    // For now, allow access to admin routes if user has a token
    // The actual admin check will be done on the client side
    // TODO: Implement proper server-side admin validation
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}
