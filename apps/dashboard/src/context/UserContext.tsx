'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, loginUser, logoutUser } from '@/lib/api'
import { User } from '@repo/types'

interface UserContextType {
  accessToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) setAccessToken(token)
  }, [])

  // Optionally: Fetch user info when accessToken changes
  useEffect(() => {
    async function fetchUser() {
      if (!accessToken) {
        setUser(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const userData = await getCurrentUser(accessToken)
        setUser(userData)
      } catch (e: unknown) {
        setUser(null)
        let message = 'Unknown error'
        if (e instanceof Error) message = e.message
        setError(message)
        await logout()
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // Login method
  async function login(username: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      const token = await loginUser(username, password)
      setAccessToken(token)
      localStorage.setItem('accessToken', token)
    } catch (e: unknown) {
      let message = 'Unknown error'
      if (e instanceof Error) message = e.message
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }

  // Logout method
  async function logout() {
    if (!accessToken) {
      setAccessToken(null)
      setUser(null)
      localStorage.removeItem('accessToken')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await logoutUser(accessToken)
    } catch (e: unknown) {
      let message = 'Unknown error'
      if (e instanceof Error) message = e.message
      setError(message)
    } finally {
      setAccessToken(null)
      setUser(null)
      localStorage.removeItem('accessToken')
      setLoading(false)
    }
  }

  // Refresh token method (stub, needs real implementation)
  async function refreshToken() {
    logout()
  }

  return (
    <UserContext.Provider
      value={{ accessToken, user, loading, error, login, logout, refreshToken }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
