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
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', username, password })
  })
  const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json()
  if (!json.success) throw new Error(json.error || 'Login failed')
  return json.data
}

export async function refreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  })
  const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json()
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
