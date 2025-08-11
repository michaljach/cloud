'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import { StorageQuota } from '@repo/ui/components/storage-quota'
import { Box, Settings } from 'lucide-react'
import Link from 'next/link'

import { PageSidebarHeader } from '../notes/components/page-sidebar-header'
import { PageSidebarNotes } from '../notes/components/page-sidebar-notes'

import { useNotes } from '@/features/notes/providers/notes-provider'

export function PageSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { refreshNotes } = useNotes()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <Box className="!size-5" />
                <span className="text-base font-semibold">Notes</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <PageSidebarHeader onNoteCreated={refreshNotes} />
        <PageSidebarNotes />
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuButton asChild className="flex items-center gap-2 px-2 w-full">
              <Link href="/settings">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <StorageQuota />
      </SidebarFooter>
    </Sidebar>
  )
}
