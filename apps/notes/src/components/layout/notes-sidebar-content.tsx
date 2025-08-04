'use client'

import { useState, useCallback } from 'react'
import { PageSidebarHeader } from './page-sidebar-header'
import { PageSidebarNotes } from './page-sidebar-notes'

export function NotesSidebarContent() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleNoteCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <>
      <PageSidebarHeader onNoteCreated={handleNoteCreated} />
      <PageSidebarNotes key={refreshKey} />
    </>
  )
}
