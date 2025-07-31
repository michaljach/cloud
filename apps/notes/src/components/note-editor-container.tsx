'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Editor } from './editor'
import { downloadNote, uploadNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/contexts'
import { base64urlDecode } from '@repo/utils'
import { useSaveStatus } from './save-status-context'

interface NoteEditorContainerProps {
  filename: string
}

export function NoteEditorContainer({ filename }: NoteEditorContainerProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { setSaveStatus, setSaveStatusText } = useSaveStatus()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const decodedFilename = base64urlDecode(filename)

  useEffect(() => {
    if (!accessToken || !currentWorkspace) return

    const fetchNote = async () => {
      try {
        setLoading(true)
        setError(null)

        const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
        const noteData = await downloadNote(decodedFilename, accessToken, workspaceId)

        const textContent = new TextDecoder().decode(noteData)
        setContent(textContent)
        setLastSavedContent(textContent)
        setSaveStatus('idle')
        setSaveStatusText('All changes saved')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note')
        setContent('')
        setLastSavedContent('')
        setSaveStatus('error')
        setSaveStatusText('Failed to load note')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [accessToken, currentWorkspace, decodedFilename, setSaveStatus, setSaveStatusText])

  const saveNote = useCallback(
    async (newContent: string) => {
      if (!accessToken || !currentWorkspace) return

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
        setSaveStatus('error')
        setSaveStatusText('Save failed')
        setError(err instanceof Error ? err.message : 'Failed to save note')

        // Clear error status after 5 seconds
        setTimeout(() => {
          setSaveStatus('idle')
          setSaveStatusText('All changes saved')
        }, 5000)
      }
    },
    [accessToken, currentWorkspace, decodedFilename, setSaveStatus, setSaveStatusText]
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
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-950 p-2 rounded mb-4">
          {error}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <Editor value={content} onChange={handleContentChange} />
      </div>
    </div>
  )
}
