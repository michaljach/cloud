'use client'

import React, { useState } from 'react'
import { useUser } from '@repo/providers'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import { Button } from '@repo/ui/components/base/button'
import { Label } from '@repo/ui/components/base/label'
import { uploadEncryptedNote } from '@repo/api/src/api'
import { encryptFile, getEncryptionKey } from '@repo/utils'

function FileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const { accessToken } = useUser()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !accessToken) {
      setStatus('File and login required')
      return
    }
    setStatus('Encrypting...')
    try {
      const encryptionKey = getEncryptionKey()
      const encrypted = await encryptFile(file, encryptionKey)
      setStatus('Uploading...')
      await uploadEncryptedNote(encrypted, file.name, accessToken)
      setStatus('Upload successful!')
    } catch (err: any) {
      setStatus('Error: ' + err.message)
    }
  }

  return (
    <Card className="max-w-xl w-full mx-auto mb-4">
      <CardHeader>
        <CardTitle>Upload Encrypted Note</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="file-upload">File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button type="submit">Upload Encrypted Note</Button>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

export { FileUpload }
