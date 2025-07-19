'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, loginUser, logoutUser, refreshToken } from '@/lib/api'
import { User } from '@repo/types'

interface UserContextType {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Load tokens from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const refresh = localStorage.getItem('refreshToken')
    if (token) setAccessToken(token)
    if (refresh) setRefreshTokenState(refresh)
  }, [])

  // Fetch user info when accessToken changes
  useEffect(() => {
    async function fetchUser() {
      if (!accessToken) {
        setUser(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const { data } = await getCurrentUser(accessToken)
        setUser(data)
      } catch (e: unknown) {
        setUser(null)
        setError(e instanceof Error ? e.message : 'Unknown error')
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
      const { accessToken, refreshToken } = await loginUser(username, password)
      setAccessToken(accessToken)
      setRefreshTokenState(refreshToken)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      throw e
    } finally {
      setLoading(false)
    }
  }

  // Logout method
  async function logout() {
    setLoading(true)
    setError(null)
    try {
      if (refreshTokenState) {
        await logoutUser(refreshTokenState)
      } else if (accessToken) {
        await logoutUser(accessToken)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setAccessToken(null)
      setRefreshTokenState(null)
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setLoading(false)
    }
  }

  // Refresh token method
  async function refresh() {
    if (!refreshTokenState) {
      await logout()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await refreshToken(refreshTokenState)
      setAccessToken(newAccessToken)
      setRefreshTokenState(newRefreshToken)
      localStorage.setItem('accessToken', newAccessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      await logout()
    } finally {
      setLoading(false)
    }
  }

  return (
    <UserContext.Provider
      value={{
        accessToken,
        refreshToken: refreshTokenState,
        user,
        loading,
        error,
        login,
        logout,
        refresh
      }}
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
