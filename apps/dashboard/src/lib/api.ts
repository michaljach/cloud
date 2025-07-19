import { User } from '@repo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function getCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 401 || res.status === 400) {
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json()
}

export async function registerUser(username: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Registration failed')
  return data
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
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export async function refreshToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Refresh failed')
  return { accessToken: data.accessToken, refreshToken: data.refreshToken }
}

export async function logoutUser(token: string): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
}
