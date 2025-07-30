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
import { getMyInvites } from '@repo/api'
import type { WorkspaceInvite } from '@repo/types'

interface InviteContextType {
  invites: WorkspaceInvite[]
  loading: boolean
  error: string | null
  refreshInvites: () => Promise<void>
  inviteCount: number
}

const InviteContext = createContext<InviteContextType | undefined>(undefined)

export function InviteProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useUser()
  const [invites, setInvites] = useState<WorkspaceInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvites = useCallback(async () => {
    if (!user || !accessToken) {
      setInvites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const invitesData = await getMyInvites(accessToken)
      setInvites(invitesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations')
      setInvites([])
    } finally {
      setLoading(false)
    }
  }, [user, accessToken])

  // Fetch invites when user or accessToken changes
  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const refreshInvites = useCallback(async () => {
    await fetchInvites()
  }, [fetchInvites])

  const inviteCount = invites.length

  const value: InviteContextType = {
    invites,
    loading,
    error,
    refreshInvites,
    inviteCount
  }

  return <InviteContext.Provider value={value}>{children}</InviteContext.Provider>
}

export function useInvites() {
  const ctx = useContext(InviteContext)
  if (!ctx) throw new Error('useInvites must be used within InviteProvider')
  return ctx
}
