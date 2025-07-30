'use client'

import * as React from 'react'
import { Building2, PlusCircle, ShieldUser } from 'lucide-react'
import { useUser, useWorkspace } from '@repo/auth'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@repo/ui/components/base/sidebar'
import Link from 'next/link'
import { InvitationsSidebarItem } from './invitations-sidebar-item'

// Utility functions for user permissions
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

function hasWorkspaces(user: any): boolean {
  return (user?.workspaces?.length ?? 0) > 0
}

export function WorkspacesSidebarItem() {
  const { user, loading } = useUser()
  const { currentWorkspace } = useWorkspace()
  const userIsRootAdmin = isRootAdmin(user)
  const userHasWorkspaces = hasWorkspaces(user)

  return (
    <>
      {/* My Workspaces - Always show Create Workspace and Invitations */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="My Workspaces">
            <Link href="/workspaces">
              <Building2 />
              <span className="font-medium">My Workspaces</span>
            </Link>
          </SidebarMenuButton>
          <SidebarMenuSub>
            {/* Show loading state while user data is being fetched */}
            {loading && (
              <div className="px-2 py-2">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            )}
            {!loading && (
              <>
                {userHasWorkspaces &&
                  user?.workspaces?.map((userWorkspace: any) => (
                    <SidebarMenuSubItem key={userWorkspace.workspace.id}>
                      <SidebarMenuSubButton asChild>
                        <Link href={`/workspaces/${userWorkspace.workspace.id}`}>
                          {userWorkspace.workspace.name}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <Link href="/workspaces/create">
                      <div className="flex items-center gap-1">
                        <PlusCircle className="w-4 h-4" />
                        Create Workspace
                      </div>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <InvitationsSidebarItem />
              </>
            )}
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Admin Console - Only show for root admins */}
      {!loading && userIsRootAdmin && (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Administration console">
              <Link href="/admin-console">
                <ShieldUser />
                <span className="font-medium">Administration console</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuSub>
              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <Link href="/admin-console/users">Users</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>

              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <Link href="/admin-console/workspaces">Workspaces</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>

              <SidebarMenuSubItem>
                <SidebarMenuSubButton asChild>
                  <Link href="/admin-console/settings">Settings</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  )
}
