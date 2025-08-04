'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  useSidebar
} from '@repo/ui/components/base/sidebar'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import Link from 'next/link'
import { base64urlEncode } from '@repo/utils'
import { useWorkspace } from '@repo/contexts'
import { listNotes } from '@repo/api'

export function PageSidebarNotes() {
  const { currentWorkspace } = useWorkspace()
  const { selectedNote } = useSidebar()
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  const fetchNotes = useCallback(async () => {
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

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes, refreshKey])

  const refreshNotes = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
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
  )
}
