'use client'

import { listNotes, renameNote, deleteNote } from '@repo/api'
import { useWorkspace, useUser } from '@repo/providers'
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

import { extractTitleFromContent } from '@/utils/markdown'

interface NoteInfo {
  filename: string
  title: string
}

interface NotesContextType {
  notes: NoteInfo[]
  loading: boolean
  error: string | null
  refreshNotes: () => void
  updateNoteTitle: (filename: string, content: string) => void
  renameNoteFile: (oldFilename: string, newFilename: string) => Promise<void>
  deleteNoteFile: (filename: string) => Promise<void>
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

interface NotesProviderProps {
  children: ReactNode
}

export function NotesProvider({ children }: NotesProviderProps) {
  const { currentWorkspace } = useWorkspace()
  const { accessToken } = useUser()
  const [notes, setNotes] = useState<NoteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const extractTitleFromFilename = useCallback((filename: string): string => {
    // Remove .md extension
    const nameWithoutExt = filename.replace(/\.md$/, '')

    // Convert kebab-case to readable title
    const title = nameWithoutExt.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

    return title || 'New note'
  }, [])

  const fetchNotes = useCallback(async () => {
    if (!currentWorkspace || !accessToken) return
    setLoading(true)

    try {
      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      const fetchedFilenames = await listNotes(accessToken, workspaceId)

      // Extract titles from filenames
      const notesWithTitles = fetchedFilenames.map((filename) => ({
        filename,
        title: extractTitleFromFilename(filename)
      }))

      setNotes(notesWithTitles)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [currentWorkspace, accessToken, extractTitleFromFilename])

  const refreshNotes = useCallback(() => {
    fetchNotes()
  }, [fetchNotes])

  const updateNoteTitle = useCallback((filename: string, content: string) => {
    // This function is now used for real-time title updates in the sidebar
    // The actual filename change will be handled by renameNoteFile
    const title = extractTitleFromContent(content)
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.filename === filename ? { ...note, title } : note))
    )
  }, [])

  const renameNoteFile = useCallback(
    async (oldFilename: string, newFilename: string) => {
      if (!accessToken || !currentWorkspace) return

      try {
        const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
        await renameNote(oldFilename, newFilename, accessToken, workspaceId)

        // Update the notes list with the new filename
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.filename === oldFilename
              ? { ...note, filename: newFilename, title: extractTitleFromFilename(newFilename) }
              : note
          )
        )
      } catch (err) {
        console.error('Failed to rename note:', err)
        throw err
      }
    },
    [accessToken, currentWorkspace, extractTitleFromFilename]
  )

  const deleteNoteFile = useCallback(
    async (filename: string) => {
      if (!accessToken || !currentWorkspace) return

      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      await deleteNote(filename, accessToken, workspaceId)

      // Update the notes list by removing the deleted note
      setNotes((prevNotes) => prevNotes.filter((note) => note.filename !== filename))
    },
    [accessToken, currentWorkspace]
  )

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const value: NotesContextType = {
    notes,
    loading,
    error,
    refreshNotes,
    updateNoteTitle,
    renameNoteFile,
    deleteNoteFile
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
