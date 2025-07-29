'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  Users,
  Settings,
  HelpCircle,
  Box,
  PlusCircle,
  Mail,
  ShieldUser,
  Building2
} from 'lucide-react'
import { useUser, useWorkspace } from '@repo/auth'
import { WorkspaceSwitcher } from '@repo/ui/components/workspace-switcher'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@repo/ui/components/base/sidebar'
import { Button } from '@repo/ui/components/base/button'
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

function isAdmin(user: any): boolean {
  return user?.workspaces?.some((uw: any) => uw.role === 'admin' || uw.role === 'owner') ?? false
}

function hasWorkspaces(user: any): boolean {
  return (user?.workspaces?.length ?? 0) > 0
}

export function AppSidebarClient({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const { currentWorkspace } = useWorkspace()
  const userIsRootAdmin = isRootAdmin(user)
  const userIsAdmin = isAdmin(user)
  const userHasWorkspaces = hasWorkspaces(user)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">Account</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 mt-2">
          <WorkspaceSwitcher variant="outline" size="sm" className="w-full" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-4">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                >
                  <PlusCircle />
                  <span>Quick Create</span>
                </SidebarMenuButton>
                <Button
                  size="icon"
                  className="size-8 group-data-[collapsible=icon]:opacity-0"
                  variant="outline"
                >
                  <Mail />
                  <span className="sr-only">Inbox</span>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Account settings">
                  <Link href="/account">
                    <Settings />
                    <span className="font-medium">Account settings</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/account">Personal information</Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>

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
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
            {userIsRootAdmin && (
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
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  )
}
