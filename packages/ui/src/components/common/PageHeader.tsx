'use client'

import { useUser } from '@repo/providers'
import { Header } from '@repo/ui/components/header'
import { useAppNavigation, AppNavigationConfig } from '@repo/ui/hooks/useAppNavigation'
import React from 'react'

interface PageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
  config: AppNavigationConfig
  showStatus?: boolean
  StatusComponent?: React.ComponentType
}

export function PageHeader({
  title,
  children,
  config,
  showStatus = false,
  StatusComponent
}: PageHeaderProps) {
  const { user, loading } = useUser()
  const { handleAccountClick, handleLogoutClick, handleAdminClick, getAppsLinks } =
    useAppNavigation(config)

  if (!user && !loading) {
    return null
  }

  return (
    <Header
      title={title}
      user={user}
      loading={loading}
      onLogout={handleLogoutClick}
      onAccountClick={handleAccountClick}
      onAdminClick={handleAdminClick}
      appsLinks={getAppsLinks()}
    >
      {showStatus && StatusComponent && <StatusComponent />}
      {children}
    </Header>
  )
}
