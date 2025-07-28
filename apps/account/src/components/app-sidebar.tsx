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
import { getServerUser } from '@repo/auth'
import { cookies } from 'next/headers'

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

// Utility function to check if user is root admin
function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.name === 'System Admin'
    ) ?? false
  )
}

// Utility function to check if user is admin in any workspace
function isAdmin(user: any): boolean {
  return user?.workspaces?.some((uw: any) => uw.role === 'admin' || uw.role === 'owner') ?? false
}

// Utility function to check if user has any workspaces
function hasWorkspaces(user: any): boolean {
  return (user?.workspaces?.length ?? 0) > 0
}

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const cookiesStore = await cookies()
  const user = await getServerUser({ cookies: () => cookiesStore })
  const userIsAdmin = isAdmin(user)
  const userIsRootAdmin = isRootAdmin(user)
  const userHasWorkspaces = hasWorkspaces(user)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
            {userHasWorkspaces && (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="My Workspaces">
                    <Link href="/workspaces">
                      <Building2 />
                      <span className="font-medium">My Workspaces</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {user?.workspaces?.map((userWorkspace: any) => (
                      <SidebarMenuSubItem key={userWorkspace.workspace.id}>
                        <SidebarMenuSubButton asChild>
                          <Link href={`/workspaces/${userWorkspace.workspace.id}`}>
                            {userWorkspace.workspace.name}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            )}
            {userIsAdmin && (
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
                    {userIsRootAdmin && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <Link href="/admin-console/workspaces">Workspaces</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <Link href="/admin-console/roles">Roles</Link>
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
