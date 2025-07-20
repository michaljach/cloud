'use client'

import React, { useState, useEffect } from 'react'
import { Editor } from '@/components/editor'
import { useUser } from '@repo/auth'
import { downloadEncryptedNote } from '@repo/api'
import { useParams } from 'next/navigation'
import { decryptFile } from '../utils/crypto'
import { base64urlDecode } from '../utils/base64'

const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes

export function NoteEditorContainer() {
  const { accessToken } = useUser()
  const params = useParams()
  const encoded =
    typeof params?.filename === 'string'
      ? params.filename
      : Array.isArray(params?.filename)
        ? params.filename[0]
        : null
  const filename = encoded ? base64urlDecode(encoded) : null
  const [noteContent, setNoteContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filename || !accessToken) return
    setLoading(true)
    setError(null)
    downloadEncryptedNote(filename, accessToken)
      .then((encrypted) => decryptFile(encrypted, HARDCODED_KEY))
      .then(setNoteContent)
      .catch((e) => {
        setError(e.message)
        setNoteContent('')
      })
      .finally(() => setLoading(false))
  }, [filename, accessToken])

  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        {loading && <div>Loading note...</div>}
        {error && <div className="text-red-500">{error}</div>}
        <Editor value={noteContent} />
      </div>
    </div>
  )
}
