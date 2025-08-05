'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useUser } from '@repo/providers'
import { getWorkspaces, getUsers } from '@repo/api'
import type { Workspace, User } from '@repo/types'

interface AdminWorkspacesContextType {
  workspaces: Workspace[]
  users: User[]
  isLoading: boolean
  error: string | null
  refreshWorkspaces: () => Promise<void>
  refreshUsers: () => Promise<void>
}

const AdminWorkspacesContext = createContext<AdminWorkspacesContextType | undefined>(undefined)

export function useAdminWorkspaces() {
  const context = useContext(AdminWorkspacesContext)
  if (context === undefined) {
    throw new Error('useAdminWorkspaces must be used within an AdminWorkspacesProvider')
  }
  return context
}

interface AdminWorkspacesProviderProps {
  children: ReactNode
}

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

export function AdminWorkspacesProvider({ children }: AdminWorkspacesProviderProps) {
  const { user, accessToken } = useUser()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshWorkspaces = useCallback(async () => {
    if (!accessToken) return
    try {
      const fetchedWorkspaces = await getWorkspaces(accessToken)
      setWorkspaces(fetchedWorkspaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces')
    }
  }, [accessToken])

  const refreshUsers = useCallback(async () => {
    if (!accessToken) return
    try {
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    }
  }, [accessToken])

  useEffect(() => {
    if (!user || !accessToken) return

    // Check if user is root admin
    const userIsRootAdmin = isRootAdmin(user)

    if (!user || !userIsRootAdmin) {
      setError('Forbidden')
      return
    }

    refreshWorkspaces()
    refreshUsers()
  }, [user, accessToken, refreshWorkspaces, refreshUsers])

  const value: AdminWorkspacesContextType = {
    workspaces,
    users,
    isLoading,
    error,
    refreshWorkspaces,
    refreshUsers
  }

  return <AdminWorkspacesContext.Provider value={value}>{children}</AdminWorkspacesContext.Provider>
}
