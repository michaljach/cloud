'use client'

import { PlusCircle } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import Link from 'next/link'
import { createEmptyNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/contexts'
import { base64urlEncode } from '@repo/utils'

export function NavMain({
  items,
  onNoteCreated
}: {
  items: {
    title: string
    url: string
    icon?: any
  }[]
  onNoteCreated?: () => void
}) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNote = async () => {
    if (!accessToken || !currentWorkspace || isCreating) return

    try {
      setIsCreating(true)
      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      const { filename } = await createEmptyNote(accessToken, workspaceId)

      // Trigger refresh of notes list
      onNoteCreated?.()

      // Navigate to the new note
      router.push(`/note/${base64urlEncode(filename)}`)
    } catch (error) {
      console.error('Failed to create note:', error)
      // You might want to show a toast notification here
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              onClick={handleCreateNote}
              disabled={isCreating}
            >
              <PlusCircle />
              <span>{isCreating ? 'Creating...' : 'Create new note'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
