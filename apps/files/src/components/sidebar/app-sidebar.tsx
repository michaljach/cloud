'use client'

import { SidebarMenuButton } from '@repo/ui/components/base/sidebar'
import { Icon } from '@repo/ui/components/base/icons'
import { useUser, useWorkspace } from '@repo/contexts'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const { currentWorkspace } = useWorkspace()

  const isRootAdmin =
    user?.workspaces?.some(
      (uw) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false

  const isAdmin =
    user?.workspaces?.some((uw) => uw.role === 'admin' || uw.role === 'owner') ?? false

  const handleLogout = async () => {
    // This will be handled by the header
    router.push('/login')
  }

  const handleAccountClick = () => {
    router.push('/account')
  }

  return (
    <>
      <SidebarMenuButton asChild isActive={pathname === '/'}>
        <Link href="/">
          <Icon.File />
          <span>Files</span>
        </Link>
      </SidebarMenuButton>

      <SidebarMenuButton asChild isActive={pathname === '/trash'}>
        <Link href="/trash">
          <Icon.Trash2 />
          <span>Trash</span>
        </Link>
      </SidebarMenuButton>

      {isAdmin && (
        <SidebarMenuButton asChild isActive={pathname.startsWith('/admin-console')}>
          <Link href="/admin-console">
            <Icon.Settings />
            <span>Admin Console</span>
          </Link>
        </SidebarMenuButton>
      )}
    </>
  )
}
