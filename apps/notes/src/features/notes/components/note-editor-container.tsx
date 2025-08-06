'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Editor } from './editor'
import { downloadNote, uploadNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/providers'
import { base64urlDecode } from '@repo/utils'
import { useSaveStatus } from '@/features/notes/providers/status-provider'
import { useSidebar } from '@repo/ui/components/base/sidebar'
import { toast } from 'sonner'

interface NoteEditorContainerProps {
  filename: string
}

export function NoteEditorContainer({ filename }: NoteEditorContainerProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { setSaveStatus, setSaveStatusText } = useSaveStatus()
  const { setSelectedNote } = useSidebar()
  const pathname = usePathname()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef(false)

  const decodedFilename = base64urlDecode(filename)

  // Check if we're on the correct note page
  const isOnNotePage = pathname === `/note/${filename}`

  // Memoize the fetchNote function to prevent unnecessary re-renders
  const fetchNote = useCallback(async () => {
    if (!accessToken || !currentWorkspace || !isOnNotePage) return

    // Prevent duplicate requests
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      const noteData = await downloadNote(decodedFilename, accessToken, workspaceId)

      const textContent = new TextDecoder().decode(noteData)
      setContent(textContent)
      setLastSavedContent(textContent)
      setSaveStatus('idle')
      setSaveStatusText('All changes saved')
      setSelectedNote(decodedFilename)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load note'
      toast.error(errorMessage)
      setError(errorMessage)
      setContent('')
      setLastSavedContent('')
      setSaveStatus('error')
      setSaveStatusText('Failed to load note')
      setSelectedNote(null)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [accessToken, currentWorkspace, decodedFilename, isOnNotePage])

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
      isFetchingRef.current = false
      return
    }

    // Don't load if we don't have the required data
    if (!accessToken || !currentWorkspace) return

    fetchNote()
  }, [isOnNotePage, accessToken, currentWorkspace, decodedFilename, fetchNote])

  const saveNote = useCallback(
    async (newContent: string) => {
      if (!accessToken || !currentWorkspace || !isOnNotePage) return

      try {
        setSaveStatus('saving')
        setSaveStatusText('Saving...')
        const contentBuffer = new TextEncoder().encode(newContent)

        const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
        await uploadNote(contentBuffer, decodedFilename, accessToken, workspaceId)

        setLastSavedContent(newContent)
        setSaveStatus('saved')
        setSaveStatusText('Saved')

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
    [accessToken, currentWorkspace, decodedFilename, setSaveStatus, setSaveStatusText, isOnNotePage]
  )

  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      setError(null) // Clear any previous errors when user starts typing

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
    [lastSavedContent, saveNote, setSaveStatusText]
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
        <Editor value={content} onChange={handleContentChange} />
      </div>
    </div>
  )
}
