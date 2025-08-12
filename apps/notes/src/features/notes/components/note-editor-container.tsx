'use client'

import { downloadNote, uploadNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import { useSidebar } from '@repo/ui/components/base/sidebar'
import { base64urlDecode, base64urlEncode } from '@repo/utils'
import { Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'

import { Editor } from './editor'

import { DeleteNoteDialog } from '@/features/notes/dialogs/delete-note-dialog'
import { useNotes } from '@/features/notes/providers/notes-provider'
import { useSaveStatus } from '@/features/notes/providers/status-provider'
import { generateFilenameFromContent } from '@/utils/markdown'

interface NoteEditorContainerProps {
  filename: string
}

export function NoteEditorContainer({ filename }: NoteEditorContainerProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { setSaveStatus, setSaveStatusText } = useSaveStatus()
  const { setSelectedNote } = useSidebar()
  const { updateNoteTitle, renameNoteFile, notes, deleteNoteFile } = useNotes()
  const pathname = usePathname()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const [currentFilename, setCurrentFilename] = useState('')
  const [originalFirstLine, setOriginalFirstLine] = useState('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef(false)

  const decodedFilename = base64urlDecode(filename)

  // Check if we're on the correct note page
  const isOnNotePage = pathname === `/note/${filename}`

  // Get the current note title for the delete dialog
  const currentNote = notes.find((note) => note.filename === currentFilename)
  const currentNoteTitle = currentNote?.title || 'Untitled Note'

  const handleNoteDeleted = useCallback(() => {
    // Navigate to home after deletion
    router.push('/')
  }, [router])

  // Memoize the fetchNote function to prevent unnecessary re-renders
  const fetchNote = useCallback(async () => {
    if (!accessToken || !currentWorkspace || !decodedFilename || isFetchingRef.current) return

    isFetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      const noteContent = await downloadNote(decodedFilename, accessToken, workspaceId)
      const decodedContent = new TextDecoder().decode(noteContent)

      setContent(decodedContent)
      setLastSavedContent(decodedContent)
      setCurrentFilename(decodedFilename)

      // Extract and store the original first line for comparison
      const lines = decodedContent.split('\n')
      const firstNonEmptyLine = lines.find((line) => line.trim()) || ''
      setOriginalFirstLine(firstNonEmptyLine.trim())

      setSelectedNote(decodedFilename)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load note'
      setError(errorMessage)
      setSaveStatus('error')
      setSaveStatusText('Failed to load note')
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [accessToken, currentWorkspace, decodedFilename, setSelectedNote])

  // Single useEffect to handle note loading and selection
  useEffect(() => {
    // Clear everything when not on the note page
    if (!isOnNotePage) {
      setContent('')
      setError(null)
      setLoading(false)
      setSaveStatus('idle')
      setSaveStatusText('')
      setSelectedNote(null)
      setCurrentFilename('')
      isFetchingRef.current = false
      return
    }

    // Don't load if we don't have the required data
    if (!accessToken || !currentWorkspace) return

    fetchNote()
  }, [isOnNotePage, accessToken, currentWorkspace, decodedFilename, fetchNote])

  const saveNote = useCallback(
    async (newContent: string) => {
      if (!accessToken || !currentWorkspace || !isOnNotePage || !currentFilename) return

      try {
        setSaveStatus('saving')
        setSaveStatusText('Saving...')

        // Check if the first line has actually changed
        const lines = newContent.split('\n')
        const currentFirstLine = lines.find((line) => line.trim()) || ''
        const hasFirstLineChanged = currentFirstLine.trim() !== originalFirstLine

        const contentBuffer = new TextEncoder().encode(newContent)
        const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id

        // Only rename if the first line has actually changed
        if (hasFirstLineChanged) {
          // Generate new filename based on content
          const existingFilenames = notes.map((note) => note.filename)
          const newFilename = generateFilenameFromContent(newContent, existingFilenames)

          if (newFilename !== currentFilename) {
            try {
              // First upload the new content with the current filename
              await uploadNote(contentBuffer, currentFilename, accessToken, workspaceId)

              // Then rename the file
              await renameNoteFile(currentFilename, newFilename)

              // Update the current filename and navigate to the new URL
              setCurrentFilename(newFilename)
              const newEncodedFilename = base64urlEncode(newFilename)
              router.replace(`/note/${newEncodedFilename}`)

              // Update the original first line to the new first line
              setOriginalFirstLine(currentFirstLine.trim())

              setLastSavedContent(newContent)
              setSaveStatus('saved')
              setSaveStatusText('Saved and renamed')
            } catch {
              // If rename fails, just save with the current filename
              await uploadNote(contentBuffer, currentFilename, accessToken, workspaceId)
              setLastSavedContent(newContent)
              setSaveStatus('saved')
              setSaveStatusText('Saved')
            }
          } else {
            // First line changed but filename would be the same, just save
            await uploadNote(contentBuffer, currentFilename, accessToken, workspaceId)
            setOriginalFirstLine(currentFirstLine.trim())
            setLastSavedContent(newContent)
            setSaveStatus('saved')
            setSaveStatusText('Saved')
          }
        } else {
          // No first line change, just save
          await uploadNote(contentBuffer, currentFilename, accessToken, workspaceId)
          setLastSavedContent(newContent)
          setSaveStatus('saved')
          setSaveStatusText('Saved')
        }

        // Clear saved status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setSaveStatusText('All changes saved')
        }, 2000)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save note'
        toast.error(errorMessage)
        setSaveStatus('error')
        setSaveStatusText('Save failed')
        setError(errorMessage)

        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setSaveStatusText('All changes saved')
        }, 5000)
      }
    },
    [
      accessToken,
      currentWorkspace,
      currentFilename,
      isOnNotePage,
      notes,
      renameNoteFile,
      router,
      originalFirstLine
    ]
  )

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      setError(null) // Clear any previous errors when user starts typing

      // Update the note title in the sidebar
      updateNoteTitle(currentFilename, newContent)

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Only save if content has actually changed from last saved version
      if (newContent !== lastSavedContent) {
        setSaveStatusText('Unsaved changes')
        // Debounce save for 1 second
        saveTimeoutRef.current = setTimeout(() => {
          saveNote(newContent)
        }, 1000)
      } else {
        setSaveStatusText('All changes saved')
      }
    },
    [lastSavedContent, saveNote, setSaveStatusText, updateNoteTitle, currentFilename]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading note...</div>
  }

  if (error && !content) {
    return <div className="flex items-center justify-center h-64">Failed to load note</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <Editor
          value={content}
          onChange={handleContentChange}
          deleteButton={
            <DeleteNoteDialog
              filename={currentFilename}
              title={currentNoteTitle}
              onDeleted={handleNoteDeleted}
              trigger={
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Note
                </Button>
              }
            />
          }
        />
      </div>
    </div>
  )
}
