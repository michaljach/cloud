'use client'

import { Header } from '@repo/ui/components/header'
import { useUser } from '@repo/auth'
import { useRouter } from 'next/navigation'
import React from 'react'

const accountUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL

interface HeaderUserProviderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function HeaderUserProvider({ title, children }: HeaderUserProviderProps) {
  const { user, loading, logout } = useUser()
  const router = useRouter()

  function handleAccountClick() {
    router.push(`${accountUrl}/account`)
  }

  function handleLogoutClick() {
    logout()
    router.push(`${accountUrl}/login`)
  }

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
    >
      {children}
    </Header>
  )
}
