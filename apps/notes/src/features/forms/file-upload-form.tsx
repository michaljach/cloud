'use client'

import { uploadEncryptedNote } from '@repo/api/src/api'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@repo/ui/components/base/card'
import { Input } from '@repo/ui/components/base/input'
import { Label } from '@repo/ui/components/base/label'
import { useFileUpload } from '@repo/ui/hooks/useFileUpload'
import React from 'react'

function FileUpload() {
  const { accessToken } = useUser()

  const { files, status, isUploading, setFiles, uploadFiles } = useFileUpload({
    onSuccess: () => {
      // Success handled by the hook
    },
    onError: (error) => {
      // Error handled by the hook
    }
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length || !accessToken) {
      return
    }

    await uploadFiles(files, async (encryptedFiles) => {
      await uploadEncryptedNote(encryptedFiles[0].file, encryptedFiles[0].filename, accessToken)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      setFiles([selectedFile])
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
            <Input id="file-upload" type="file" onChange={handleFileChange} />
          </div>
          <Button type="submit" disabled={isUploading || !files.length}>
            {isUploading ? 'Uploading...' : 'Upload Encrypted Note'}
          </Button>
          {status && <div className="text-sm text-muted-foreground">{status}</div>}
        </form>
      </CardContent>
      <CardFooter />
    </Card>
  )
}

export { FileUpload }
