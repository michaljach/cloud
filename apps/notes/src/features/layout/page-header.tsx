'use client'

import { Header } from '@repo/ui/components/header'
import { useUser } from '@repo/providers'
import { useRouter } from 'next/navigation'
import React from 'react'
import { PageHeaderStatus } from '@/features/layout/page-header-status'

const accountUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL

interface PageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { user, loading, logout } = useUser()
  const router = useRouter()

  function handleAccountClick() {
    router.push(`${accountUrl}/account`)
  }

  function handleLogoutClick() {
    logout()
    router.push(`${accountUrl}/auth/signin`)
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
      appsLinks={[
        { label: 'Notes', href: process.env.NEXT_PUBLIC_NOTES_APP_URL || '/notes' },
        { label: 'Files', href: process.env.NEXT_PUBLIC_FILES_APP_URL || '/files' },
        { label: 'Account', href: accountUrl || '/account' }
      ]}
    >
      <PageHeaderStatus />
      {children}
    </Header>
  )
}
