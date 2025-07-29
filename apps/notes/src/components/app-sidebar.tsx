'use client'

import * as React from 'react'
import { Settings, Box } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar
} from '@repo/ui/components/base/sidebar'

import { NavMain } from './nav-main'
import { listNotes } from '@repo/api'
import { useUser, useWorkspace } from '@repo/auth'
import { WorkspaceSwitcher } from '@repo/ui/components/workspace-switcher'
import Link from 'next/link'
import { base64urlEncode } from '@repo/utils'
import { StorageQuota } from './storage-quota'
import { Skeleton } from '@repo/ui/components/base/skeleton'

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg'
  },
  navMain: [],
  navClouds: [],
  navSecondary: [],
  documents: []
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { selectedNote } = useSidebar()
  const [notes, setNotes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!accessToken || !currentWorkspace) return
    setLoading(true)

    const fetchNotes = async () => {
      try {
        const fetchedNotes = await listNotes(
          accessToken,
          currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
        )
        setNotes(fetchedNotes)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notes')
        setNotes([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [accessToken, currentWorkspace])

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
        <div className="px-2 mt-2">
          <WorkspaceSwitcher variant="outline" size="sm" className="w-full" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading && (
              <div className="space-y-2 px-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            )}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && notes.length === 0 && (
              <div className="text-muted-foreground text-sm px-2 py-1">No notes</div>
            )}
            {notes.map((file) => (
              <SidebarMenuButton
                key={file}
                asChild
                className={`flex items-center gap-2 px-2 w-full${selectedNote === file ? ' bg-primary text-primary-foreground' : ''}`}
              >
                <Link href={`/note/${base64urlEncode(file)}`}>{file}</Link>
              </SidebarMenuButton>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
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
