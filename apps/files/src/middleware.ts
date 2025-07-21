import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getServerUser } from '@repo/auth'

const ACCOUNT_APP_URL = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL!

export async function middleware(request: NextRequest) {
  const { pathname, href } = request.nextUrl

  // Allow static files, _next, favicon, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // static assets
  ) {
    return NextResponse.next()
  }

  // Check user
  const user = await getServerUser({ cookies: () => request.cookies })
  if (!user) {
    // Redirect to account app login if env var is set
    const redirectUrl = `${ACCOUNT_APP_URL}/login?redirect=${encodeURIComponent(href)}`
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}
