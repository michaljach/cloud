import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@repo/auth'

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

  // Allow login page
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Check user
  const user = await getServerUser({ cookies: () => request.cookies })
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}
