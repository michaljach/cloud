'use client'

import { getUsers } from '@repo/api'
import { useUser } from '@repo/providers'
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

import type { User } from '@repo/types'

interface AdminUsersContextType {
  users: User[]
  isLoading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
}

const AdminUsersContext = createContext<AdminUsersContextType | undefined>(undefined)

export function useAdminUsers() {
  const context = useContext(AdminUsersContext)
  if (context === undefined) {
    throw new Error('useAdminUsers must be used within an AdminUsersProvider')
  }
  return context
}

interface AdminUsersProviderProps {
  children: ReactNode
}

export function AdminUsersProvider({ children }: AdminUsersProviderProps) {
  const { user, accessToken } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshUsers = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!user || !accessToken) return

    // Check if user is root admin
    const isRootAdmin =
      user.workspaces?.some(
        (uw) => uw.role === 'owner' && uw.workspace.id === 'system-admin-workspace'
      ) ?? false

    if (!isRootAdmin) {
      setError('Forbidden')
      return
    }
    refreshUsers()
  }, [user, accessToken, refreshUsers])

  const value: AdminUsersContextType = {
    users,
    isLoading,
    error,
    refreshUsers
  }

  return <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>
}
