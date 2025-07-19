import { User } from '@repo/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!
const CLIENT_SECRET = process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET!

export async function getCurrentUser(accessToken: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
  if (res.status === 401 || res.status === 400) {
    throw new Error('Unauthorized')
  }
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json()
}

export async function loginUser(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')
  return data.accessToken
}

export async function logoutUser(accessToken: string): Promise<void> {
  await fetch(`${API_URL}/api/users/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}
