'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { accessToken, logout, loading: userLoading, login } = useUser()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      window.location.href = '/'
    } catch (err: unknown) {
      let message = 'Login failed'
      if (err instanceof Error) message = err.message
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (accessToken) {
    return (
      <div>
        <p>You are already logged in.</p>
        <button onClick={logout} disabled={userLoading}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
      </div>
      {error && <div>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
