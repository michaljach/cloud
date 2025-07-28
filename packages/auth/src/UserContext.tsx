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

interface StorageQuotaData {
  totalUsage: { bytes: number; megabytes: number }
  breakdown: {
    files: { bytes: number; megabytes: number }
    notes: { bytes: number; megabytes: number }
    photos: { bytes: number; megabytes: number }
  }
}

interface UserContextType {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  storageQuota: StorageQuotaData | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateUser: (updateUser: User) => Promise<void>
  refreshStorageQuota: () => Promise<void>
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
  const [storageQuota, setStorageQuota] = useState<StorageQuotaData | null>(null)
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

  // Load tokens from cookies on mount
  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (token) setAccessToken(token)
    // If you store refreshToken in cookies, load it here as well
    const refresh = Cookies.get('refreshToken')
    if (refresh) setRefreshTokenState(refresh)
  }, [])

  // Fetch user info when accessToken changes
  useEffect(() => {
    async function fetchUser() {
      if (!accessToken) {
        setUser(null)
        setStorageQuota(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const result = await getCurrentUser(accessToken)
        setUser(result.user)
        setStorageQuota(result.storageQuota)
      } catch (e: unknown) {
        setUser(null)
        setStorageQuota(null)
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

  // Refresh storage quota method - now fetches user data which includes storage quota
  const refreshStorageQuota = useCallback(async () => {
    if (!accessToken) {
      setStorageQuota(null)
      return
    }

    try {
      const result = await getCurrentUser(accessToken)
      setUser(result.user)
      setStorageQuota(result.storageQuota)
    } catch (err: any) {
      console.error('Failed to fetch user data:', err)
    }
  }, [accessToken])

  // Login method
  const login = useCallback(async (username: string, passwordInput: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await loginUser(username, passwordInput)
      setAccessToken(result.accessToken)
      setRefreshTokenState(result.refreshToken)
      let cookieOptions: any = { path: '/' }
      if (result.accessTokenExpiresAt) {
        const exp = new Date(result.accessTokenExpiresAt).getTime()
        setAccessTokenExpiresAt(exp)
        cookieOptions.expires = new Date(exp)
      }
      if (result.refreshTokenExpiresAt) {
        const exp = new Date(result.refreshTokenExpiresAt).getTime()
        setRefreshTokenExpiresAt(exp)
      }
      Cookies.set('accessToken', result.accessToken, cookieOptions)
      // Also store refresh token in cookie with its own expiry
      if (result.refreshTokenExpiresAt) {
        Cookies.set('refreshToken', result.refreshToken, {
          path: '/',
          expires: new Date(result.refreshTokenExpiresAt)
        })
      }
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
      Cookies.remove('accessToken', { path: '/' })
      Cookies.remove('refreshToken', { path: '/' })
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
        Cookies.set('accessToken', result.accessToken, {
          path: '/',
          expires: new Date(exp)
        })
      }
      if (result.refreshTokenExpiresAt) {
        const exp = new Date(result.refreshTokenExpiresAt).getTime()
        setRefreshTokenExpiresAt(exp)
        Cookies.set('refreshToken', result.refreshToken, {
          path: '/',
          expires: new Date(exp)
        })
      }
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
      storageQuota,
      login,
      logout,
      refresh,
      updateUser,
      refreshStorageQuota
    }),
    [
      accessToken,
      refreshTokenState,
      user,
      loading,
      error,
      storageQuota,
      login,
      logout,
      refresh,
      updateUser,
      refreshStorageQuota
    ]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
