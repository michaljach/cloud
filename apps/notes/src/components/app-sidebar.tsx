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
import { listUserNotes } from '@repo/api'
import { useUser } from '@repo/auth'
import Link from 'next/link'
import { base64urlEncode } from '../utils/base64'

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
  const { selectedNote } = useSidebar()
  const [notes, setNotes] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    listUserNotes(accessToken)
      .then(setNotes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [accessToken])

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
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Notes</SidebarGroupLabel>
          <SidebarGroupContent>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {notes.map((file) => (
              <SidebarMenuButton
                key={file}
                asChild
                className={`flex items-center gap-2 px-2 w-full${selectedNote === file ? ' bg-primary text-primary-foreground' : ''}`}
                isActive={selectedNote === file}
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
      <SidebarFooter>v0.1</SidebarFooter>
    </Sidebar>
  )
}
