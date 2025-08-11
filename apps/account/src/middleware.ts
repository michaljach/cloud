import { getServerUser } from '@repo/providers'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

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

  // Check user
  const user = await getServerUser({ cookies: () => request.cookies })
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/signin'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin routes - require root admin access
  if (pathname.startsWith('/admin')) {
    if (!isRootAdmin(user)) {
      // Redirect to home page with error message
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/'
      homeUrl.searchParams.set('error', 'admin_access_denied')
      return NextResponse.redirect(homeUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)']
}
