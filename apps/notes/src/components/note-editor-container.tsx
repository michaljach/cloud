'use client'

import { useEffect, useState } from 'react'
import { Editor } from './editor'
import { downloadNote, uploadNote } from '@repo/api'
import { useUser, useWorkspace } from '@repo/contexts'
import { base64urlDecode } from '@repo/utils'

interface NoteEditorContainerProps {
  filename: string
}

export function NoteEditorContainer({ filename }: NoteEditorContainerProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note')
        setContent('')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [accessToken, currentWorkspace, decodedFilename])

  const handleSave = async (newContent: string) => {
    if (!accessToken || !currentWorkspace) return

    try {
      setSaving(true)
      const contentBuffer = new TextEncoder().encode(newContent)

      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      await uploadNote(contentBuffer, decodedFilename, accessToken, workspaceId)

      setContent(newContent)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading note...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  // Display current workspace name
  const workspaceName = currentWorkspace
    ? 'type' in currentWorkspace && currentWorkspace.type === 'personal'
      ? currentWorkspace.name
      : 'workspace' in currentWorkspace
        ? currentWorkspace.workspace.name
        : 'Unknown'
    : 'Unknown'

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Workspace: {workspaceName}</div>
      <Editor value={content} onChange={setContent} />
    </div>
  )
}
