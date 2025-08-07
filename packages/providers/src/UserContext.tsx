'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode
} from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, loginUser, logoutUser, updateCurrentUser } from '@repo/api'
import type { User, StorageQuotaData } from '@repo/types'
import Cookies from 'js-cookie'
import { toast } from 'sonner'

interface UserContextType {
  accessToken: string | null
  user: User | null
  loading: boolean
  error: string | null
  storageQuota: StorageQuotaData | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (updateUser: User) => Promise<void>
  refreshStorageQuota: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [accessTokenExpiresAt, setAccessTokenExpiresAt] = useState<number | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storageQuota, setStorageQuota] = useState<StorageQuotaData | null>(null)
  const router = useRouter()

  // Logout method
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await logoutUser(accessToken)
      }
    } catch (error) {
      // Error handled silently - user will be logged out regardless
    } finally {
      setAccessToken(null)
      setAccessTokenExpiresAt(null)
      setUser(null)
      setStorageQuota(null)
      setError(null)
      Cookies.remove('accessToken', { path: '/' })
      router.push('/auth/signin')
    }
  }, [accessToken, router])

  // Load tokens from cookies on mount
  useEffect(() => {
    const token = Cookies.get('accessToken')
    if (token) setAccessToken(token)
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
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        setUser(null)
        setStorageQuota(null)
        setError(errorMessage)
        await logout()
        router.push('/auth/signin')
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
      toast.error('Failed to fetch user data')
    }
  }, [accessToken])

  // Login method
  const login = useCallback(async (username: string, passwordInput: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await loginUser(username, passwordInput)
      setAccessToken(result.accessToken)
      let cookieOptions: any = { path: '/' }
      if (result.accessTokenExpiresAt) {
        const exp = new Date(result.accessTokenExpiresAt).getTime()
        setAccessTokenExpiresAt(exp)
        cookieOptions.expires = new Date(exp)
      }
      Cookies.set('accessToken', result.accessToken, cookieOptions)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({
      accessToken,
      user,
      loading,
      error,
      storageQuota,
      login,
      logout,
      updateUser,
      refreshStorageQuota
    }),
    [
      accessToken,
      user,
      loading,
      error,
      storageQuota,
      login,
      logout,
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
