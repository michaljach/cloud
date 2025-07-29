'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react'
import { useUser } from './UserContext'
import { getMyWorkspaces } from '@repo/api'
import type { WorkspaceMembership } from '@repo/types'
import Cookies from 'js-cookie'
import { PERSONAL_WORKSPACE_ID } from './constants'

export interface PersonalWorkspace {
  id: typeof PERSONAL_WORKSPACE_ID
  name: string
  type: 'personal'
}

export interface WorkspaceContextType {
  currentWorkspace: WorkspaceMembership | PersonalWorkspace | null
  availableWorkspaces: (WorkspaceMembership | PersonalWorkspace)[]
  loading: boolean
  error: string | null
  switchToWorkspace: (workspaceId: string) => void
  switchToPersonal: () => void
  refreshWorkspaces: () => Promise<void>
  isPersonalSpace: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useUser()
  const [currentWorkspace, setCurrentWorkspace] = useState<
    WorkspaceMembership | PersonalWorkspace | null
  >(null)
  const [availableWorkspaces, setAvailableWorkspaces] = useState<
    (WorkspaceMembership | PersonalWorkspace)[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Personal workspace object
  const personalWorkspace: PersonalWorkspace = {
    id: PERSONAL_WORKSPACE_ID,
    name: 'Personal Space',
    type: 'personal'
  }

  const fetchWorkspaces = useCallback(async () => {
    if (!accessToken) {
      setAvailableWorkspaces([personalWorkspace])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const workspaces = await getMyWorkspaces(accessToken)

      // Add personal workspace to the beginning
      const allWorkspaces = [personalWorkspace, ...workspaces]
      setAvailableWorkspaces(allWorkspaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces')
      // Fallback to personal workspace only
      setAvailableWorkspaces([personalWorkspace])
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  const switchToWorkspace = useCallback(
    (workspaceId: string) => {
      const workspace = availableWorkspaces.find((w) => w.id === workspaceId)
      if (workspace) {
        setCurrentWorkspace(workspace)
        // Store in cookie for persistence
        Cookies.set('currentWorkspaceId', workspaceId, { expires: 30, path: '/' })
      }
    },
    [availableWorkspaces]
  )

  const switchToPersonal = useCallback(() => {
    setCurrentWorkspace(personalWorkspace)
    Cookies.set('currentWorkspaceId', PERSONAL_WORKSPACE_ID, { expires: 30, path: '/' })
  }, [])

  // Fetch workspaces when user or accessToken changes
  useEffect(() => {
    fetchWorkspaces()
  }, [fetchWorkspaces])

  // Set current workspace after fetching workspaces
  useEffect(() => {
    if (availableWorkspaces.length > 0 && !currentWorkspace) {
      const savedWorkspaceId = Cookies.get('currentWorkspaceId')
      const defaultWorkspace = savedWorkspaceId
        ? availableWorkspaces.find((w) => w.id === savedWorkspaceId)
        : personalWorkspace

      setCurrentWorkspace(defaultWorkspace || personalWorkspace)
    }
  }, [availableWorkspaces, currentWorkspace])

  const isPersonalSpace = currentWorkspace?.id === PERSONAL_WORKSPACE_ID

  const value: WorkspaceContextType = {
    currentWorkspace,
    availableWorkspaces,
    loading,
    error,
    switchToWorkspace,
    switchToPersonal,
    refreshWorkspaces: fetchWorkspaces,
    isPersonalSpace
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
