'use client'

import { createEmptyNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/providers'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@repo/ui/components/base/sidebar'
import { base64urlEncode } from '@repo/utils'
import { PlusCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface PageSidebarHeaderProps {
  onNoteCreated?: () => void
}

export function PageSidebarHeader({ onNoteCreated }: PageSidebarHeaderProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const handleCreateNote = useCallback(async () => {
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
      toast.error('Failed to create note')
    } finally {
      setIsCreating(false)
    }
  }, [accessToken, currentWorkspace, isCreating, onNoteCreated, router])

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
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
