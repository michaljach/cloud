'use client'

import { PageHeader } from '@repo/ui/components/common/PageHeader'
import { getAppConfigForApp } from '@repo/ui/utils/appConfig'
import React from 'react'

interface AccountPageHeaderProps {
  title: React.ReactNode
  children?: React.ReactNode
}

export function AccountPageHeader({ title, children }: AccountPageHeaderProps) {
  const config = getAppConfigForApp('account')

  return (
    <PageHeader title={title} config={config}>
      {children}
    </PageHeader>
  )
}
