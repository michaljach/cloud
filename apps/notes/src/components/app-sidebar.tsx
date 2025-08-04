'use client'

import * as React from 'react'
import { Box, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  SidebarMenuItem,
  useSidebar
} from '@repo/ui/components/base/sidebar'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import Link from 'next/link'
import { base64urlEncode } from '@repo/utils'
import { useWorkspace } from '@repo/contexts'
import { listNotes } from '@repo/api'
import { NavMain } from './nav-main'
import { StorageQuota } from './storage-quota'

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
  const { currentWorkspace } = useWorkspace()
  const { selectedNote, setSelectedNote } = useSidebar()
  const [notes, setNotes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const router = useRouter()
  const prevWorkspaceRef = React.useRef<string | null>(null)

  // Redirect to home if workspace changes to a different one
  React.useEffect(() => {
    const currentWorkspaceId = currentWorkspace?.id || null
    const prevWorkspaceId = prevWorkspaceRef.current

    if (prevWorkspaceId && currentWorkspaceId && prevWorkspaceId !== currentWorkspaceId) {
      // Workspace changed, redirect to home
      router.push('/')
    }

    // Update the ref with current workspace
    prevWorkspaceRef.current = currentWorkspaceId
  }, [currentWorkspace?.id, router])

  const fetchNotes = React.useCallback(async () => {
    if (!currentWorkspace) return
    setLoading(true)

    try {
      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      const fetchedNotes = await listNotes(workspaceId)
      setNotes(fetchedNotes)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace])

  React.useEffect(() => {
    fetchNotes()
  }, [fetchNotes, refreshKey])

  const refreshNotes = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

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
        <NavMain items={data.navMain} onNoteCreated={refreshNotes} />
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
                isActive={selectedNote === file}
                className="flex items-center gap-2 px-2 w-full"
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
