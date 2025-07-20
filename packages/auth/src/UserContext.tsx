'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback
} from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, loginUser, logoutUser, refreshToken } from '@repo/api'
import { User } from '@repo/types'
import Cookies from 'js-cookie'

interface UserContextType {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateUser: (updateUser: User) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null)
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(null)
  const [refreshTokenExpiresAt, setRefreshTokenExpiresAt] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const refreshTimeout = React.useRef<NodeJS.Timeout | null>(null)

  // Helper to clear scheduled refresh
  function clearRefreshTimeout() {
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current)
      refreshTimeout.current = null
    }
  }

  // Helper to schedule token refresh
  function scheduleRefresh(expiresAt: number | null) {
    clearRefreshTimeout()
    if (!expiresAt) return
    const now = Date.now()
    const msUntilExpiry = expiresAt - now
    // Refresh 1 minute before expiry, but not less than 5 seconds from now
    const msUntilRefresh = Math.max(msUntilExpiry - 60_000, 5_000)
    if (msUntilRefresh > 0) {
      refreshTimeout.current = setTimeout(() => {
        refresh()
      }, msUntilRefresh)
    }
  }

  // Load tokens and expirations from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const refresh = localStorage.getItem('refreshToken')
    const accessExp = localStorage.getItem('accessTokenExpiresAt')
    const refreshExp = localStorage.getItem('refreshTokenExpiresAt')
    if (token) setAccessToken(token)
    if (refresh) setRefreshTokenState(refresh)
    if (accessExp) setAccessTokenExpiresAt(Number(accessExp))
    if (refreshExp) setRefreshTokenExpiresAt(Number(refreshExp))
  }, [])

  // Schedule refresh when accessTokenExpiresAt changes
  useEffect(() => {
    scheduleRefresh(accessTokenExpiresAt)
    return clearRefreshTimeout
  }, [accessTokenExpiresAt])

  // Refresh on window focus if token is expired
  useEffect(() => {
    function onFocus() {
      if (accessTokenExpiresAt && Date.now() > accessTokenExpiresAt - 60_000) {
        refresh()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [accessTokenExpiresAt, refreshTokenState])

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
        const user = await getCurrentUser(accessToken)
        setUser(user)
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

  // Update user method
  const updateUser = useCallback(async (updatedUser: User) => {
    setUser(updatedUser)
  }, [])

  // Login method
  const login = useCallback(async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await loginUser(username, password)
      setAccessToken(result.accessToken)
      setRefreshTokenState(result.refreshToken)
      let cookieOptions: any = { path: '/' }
      if (result.accessTokenExpiresAt) {
        const exp = new Date(result.accessTokenExpiresAt).getTime()
        setAccessTokenExpiresAt(exp)
        localStorage.setItem('accessTokenExpiresAt', String(exp))
        cookieOptions.expires = new Date(exp)
      }
      if (result.refreshTokenExpiresAt) {
        const exp = new Date(result.refreshTokenExpiresAt).getTime()
        setRefreshTokenExpiresAt(exp)
        localStorage.setItem('refreshTokenExpiresAt', String(exp))
      }
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      Cookies.set('accessToken', result.accessToken, cookieOptions)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  // Logout method
  const logout = useCallback(async () => {
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
      setAccessTokenExpiresAt(null)
      setRefreshTokenExpiresAt(null)
      setUser(null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('accessTokenExpiresAt')
      localStorage.removeItem('refreshTokenExpiresAt')
      Cookies.remove('accessToken', { path: '/' })
      clearRefreshTimeout()
      setLoading(false)
    }
  }, [refreshTokenState, accessToken])

  // Refresh token method
  const refresh = useCallback(async () => {
    if (!refreshTokenState) {
      await logout()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await refreshToken(refreshTokenState)
      setAccessToken(result.accessToken)
      setRefreshTokenState(result.refreshToken)
      if (result.accessTokenExpiresAt) {
        const exp = new Date(result.accessTokenExpiresAt).getTime()
        setAccessTokenExpiresAt(exp)
        localStorage.setItem('accessTokenExpiresAt', String(exp))
      }
      if (result.refreshTokenExpiresAt) {
        const exp = new Date(result.refreshTokenExpiresAt).getTime()
        setRefreshTokenExpiresAt(exp)
        localStorage.setItem('refreshTokenExpiresAt', String(exp))
      }
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      await logout()
    } finally {
      setLoading(false)
    }
  }, [refreshTokenState, logout])

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken: refreshTokenState,
      user,
      loading,
      error,
      login,
      logout,
      refresh,
      updateUser
    }),
    [accessToken, refreshTokenState, user, loading, error, login, logout, refresh, updateUser]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
