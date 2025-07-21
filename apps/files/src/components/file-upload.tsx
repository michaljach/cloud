'use client'

import React, { useState, useContext } from 'react'
import { useUser } from '@repo/auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import { Button } from '@repo/ui/components/base/button'
import { Label } from '@repo/ui/components/base/label'
import { uploadEncryptedUserFile } from '@repo/api'
import { encryptFile } from '@repo/utils'
import { FilesContext } from './files-context'

export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const { accessToken } = useUser()
  const { refreshFiles } = useContext(FilesContext)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !accessToken) {
      setStatus('File and login required')
      return
    }
    setStatus('Encrypting...')
    try {
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const encrypted = await encryptFile(file, HARDCODED_KEY)
      setStatus('Uploading...')
      await uploadEncryptedUserFile(encrypted, file.name, accessToken)
      setStatus('Upload successful!')
      setFile(null)
      refreshFiles()
      if (onUploaded) onUploaded()
    } catch (err: any) {
      setStatus('Error: ' + err.message)
    }
  }

  return (
    <form onSubmit={handleUpload} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="file-upload">File</Label>
        <Input
          id="file-upload"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
      <Button type="submit">Upload File</Button>
      {status && <div className="text-sm text-muted-foreground">{status}</div>}
    </form>
  )
}
