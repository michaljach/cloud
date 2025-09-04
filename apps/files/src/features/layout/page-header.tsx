'use client'

import { PageHeader } from '@repo/ui/components/common/PageHeader'
import { getAppConfigForApp } from '@repo/ui/utils/appConfig'
import React from 'react'

interface FilesPageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function FilesPageHeader({ title, children }: FilesPageHeaderProps) {
  const config = getAppConfigForApp('files')

  return (
    <PageHeader title={title} config={config}>
      {children}
    </PageHeader>
  )
}
