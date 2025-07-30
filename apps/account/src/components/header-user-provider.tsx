'use client'

import { Header } from '@repo/ui/components/header'
import { Icon } from '@repo/ui/components/base/icons'
import { useUser } from '@repo/contexts'
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
      appsLinks={[
        {
          label: 'Notes',
          href: process.env.NEXT_PUBLIC_NOTES_APP_URL || '/notes',
          icon: <Icon.FileText />
        },
        {
          label: 'Files',
          href: process.env.NEXT_PUBLIC_FILES_APP_URL || '/files',
          icon: <Icon.File />
        },
        { label: 'Account', href: '/account', icon: <Icon.User /> }
      ]}
    >
      {children}
    </Header>
  )
}
