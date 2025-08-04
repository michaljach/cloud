'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { useWorkspace } from '@repo/contexts'
import { listNotes } from '@repo/api'

interface NotesContextType {
  notes: string[]
  loading: boolean
  error: string | null
  refreshNotes: () => void
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const { currentWorkspace } = useWorkspace()
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const refreshNotes = useCallback(() => {
    fetchNotes()
  }, [fetchNotes])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const value: NotesContextType = {
    notes,
    loading,
    error,
    refreshNotes
  }

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}
