'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useUser } from '@repo/providers'
import { getPlatformSettings, updatePlatformSettings } from '@repo/api'
import type { PlatformSettings } from '@repo/types'

// Form data interface for updating settings
interface PlatformSettingsUpdate {
  title: string
  timezone: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  defaultStorageLimit: number
  maxFileSize: number
  supportEmail: string
  companyName: string
}

interface AdminSettingsContextType {
  settings: PlatformSettings | null
  isLoading: boolean
  error: string | null
  updateSettings: (settings: PlatformSettingsUpdate) => Promise<void>
  refreshSettings: () => Promise<void>
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined)

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) {
    throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  }
  return context
}

interface AdminSettingsProviderProps {
  children: ReactNode
}

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

interface UserWorkspace {
  role: string
  workspace: {
    id: string
  }
}

interface UserWithWorkspaces {
  workspaces?: UserWorkspace[]
}

function isRootAdmin(user: UserWithWorkspaces | null): boolean {
  return (
    user?.workspaces?.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

export function AdminSettingsProvider({ children }: AdminSettingsProviderProps) {
  const { user, accessToken } = useUser()
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshSettings = useCallback(async () => {
    if (!accessToken) return

    setIsLoading(true)
    setError(null)

    try {
      const fetchedSettings = await getPlatformSettings(accessToken)
      setSettings(fetchedSettings)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform settings')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  const updateSettings = useCallback(
    async (newSettings: PlatformSettingsUpdate) => {
      if (!accessToken) return

      const updatedSettings = await updatePlatformSettings(accessToken, newSettings)
      setSettings(updatedSettings)
    },
    [accessToken]
  )

  useEffect(() => {
    if (!user || !accessToken) return

    // Check if user is root admin
    const userIsRootAdmin = isRootAdmin(user)

    if (!userIsRootAdmin) {
      setError('Forbidden: Only root administrators can access platform settings')
      return
    }

    refreshSettings()
  }, [user, accessToken, refreshSettings])

  const value: AdminSettingsContextType = {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings
  }

  return <AdminSettingsContext.Provider value={value}>{children}</AdminSettingsContext.Provider>
}
