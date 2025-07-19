const API_URL = process.env.NEXT_PUBLIC_API_URL!
const CLIENT_ID = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!
const CLIENT_SECRET = process.env.NEXT_PUBLIC_OAUTH_CLIENT_SECRET!

export async function loginWithPassword(username: string, password: string): Promise<string> {
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
