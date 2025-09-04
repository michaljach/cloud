'use client'

import { PageHeader } from '@repo/ui/components/common/PageHeader'
import { getAppConfigForApp } from '@repo/ui/utils/appConfig'
import React from 'react'

import { PageHeaderStatus } from '@/features/layout/page-header-status'

interface NotesPageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function NotesPageHeader({ title, children }: NotesPageHeaderProps) {
  const config = getAppConfigForApp('notes')

  return (
    <PageHeader title={title} config={config} showStatus={true} StatusComponent={PageHeaderStatus}>
      {children}
    </PageHeader>
  )
}
