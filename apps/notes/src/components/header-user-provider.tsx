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
    if (accountUrl) {
      router.push(`${accountUrl}/account`)
    } else {
      router.push('/account')
    }
  }

  async function handleLogout() {
    await logout()
    if (accountUrl) {
      router.push(`${accountUrl}/login`)
    } else {
      router.push('/login')
    }
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
