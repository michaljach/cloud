'use client'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
  useSidebar
} from '@repo/ui/components/base/sidebar'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import { base64urlEncode } from '@repo/utils'
import Link from 'next/link'

import { useNotes } from '@/features/notes/providers/notes-provider'

export function PageSidebarNotes() {
  const { selectedNote } = useSidebar()
  const { notes, loading, error } = useNotes()

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
        {notes.map((note) => (
          <SidebarMenuButton
            key={note.filename}
            asChild
            isActive={selectedNote === note.filename}
            className="flex items-center gap-2 px-2 w-full"
          >
            <Link href={`/note/${base64urlEncode(note.filename)}`}>{note.title}</Link>
          </SidebarMenuButton>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
