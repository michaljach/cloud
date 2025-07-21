'use client'

import React, { useState } from 'react'
import { useUser } from '@repo/auth'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import { Button } from '@repo/ui/components/base/button'
import { Label } from '@repo/ui/components/base/label'
import { uploadEncryptedUserFile } from '@repo/api'

const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes

async function encryptFile(file: File, key: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-GCM' }, false, [
    'encrypt'
  ])
  const fileBuffer = await file.arrayBuffer()
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, fileBuffer)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return result
}

export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
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
      const encrypted = await encryptFile(file, HARDCODED_KEY)
      setStatus('Uploading...')
      await uploadEncryptedUserFile(encrypted, file.name, accessToken)
      setStatus('Upload successful!')
      setFile(null)
      if (onUploaded) onUploaded()
    } catch (err: any) {
      setStatus('Error: ' + err.message)
    }
  }

  return (
    <Card className="max-w-xl w-full mx-auto mb-4">
      <CardHeader>
        <CardTitle>Upload Encrypted File</CardTitle>
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
          <Button type="submit">Upload File</Button>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  )
}
