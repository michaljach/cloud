'use client'

import { Header } from '@repo/ui/components/header'
import { useUser } from '@repo/auth'
import { useRouter } from 'next/navigation'
import React from 'react'

interface HeaderUserProviderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function HeaderUserProvider({ title, children }: HeaderUserProviderProps) {
  const router = useRouter()
  const { user, loading, logout } = useUser()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  function handleAccountClick() {
    router.push('/account')
  }

  if (!user && !loading) {
    return null
  }

  return (
    <Header
      title={title}
      user={user}
      loading={loading}
      onLogout={handleLogout}
      onAccountClick={handleAccountClick}
    >
      {children}
    </Header>
  )
}
