import { User } from '@repo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | null
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  const json: ApiResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to fetch user info')
  return json.data
}

export async function registerUser(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const json: ApiResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error || 'Registration failed')
  return json.data
}

export async function loginUser(
  username: string,
  password: string
): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt?: string
  refreshTokenExpiresAt?: string
}> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', username, password })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Login failed')
  return json.data
}

export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt?: string
  refreshTokenExpiresAt?: string
}> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  })
  const json: ApiResponse<any> = await res.json()
  if (!json.success) throw new Error(json.error || 'Refresh failed')
  return json.data
}

export async function logoutUser(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error || 'Logout failed')
}

export async function updateCurrentUser(accessToken: string, fullName: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ fullName })
  })
  const json: ApiResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error || 'Failed to update user')
  return json.data
}

/**
 * Get the current user on the server (for SSR/server components).
 * Accepts a cookies() object (from next/headers) or a Request object.
 * Returns the user or null if not authenticated.
 */
export async function getServerUser(
  context:
    | { cookies: () => { get: (name: string) => { value?: string } | undefined } }
    | { headers: { get: (name: string) => string | null } }
): Promise<User | null> {
  let accessToken: string | undefined

  // Next.js server context (cookies() from next/headers)
  if ('cookies' in context) {
    accessToken = context.cookies().get('accessToken')?.value
  } else if ('headers' in context) {
    // Node Request-like object
    const auth = context.headers.get('authorization') || context.headers.get('Authorization')
    if (auth?.startsWith('Bearer ')) {
      accessToken = auth.slice(7)
    }
  }
  if (!accessToken) return null
  try {
    return await getCurrentUser(accessToken)
  } catch {
    return null
  }
}
