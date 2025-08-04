'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File } from 'lucide-react'
import { Button } from '@repo/ui/components/base/button'
import { useUser, useWorkspace } from '@repo/contexts'
import { uploadFilesBatch } from '@repo/api'
import { encryptFile, getEncryptionKey } from '@repo/utils'
import { toast } from 'sonner'

interface FileUploadProps {
  onUploadComplete?: () => void
  className?: string
}

interface FileWithPreview extends File {
  preview?: string
}

export function FileUpload({ onUploadComplete, className = '' }: FileUploadProps) {
  const { accessToken, refreshStorageQuota } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const workspaceId = currentWorkspace?.id

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreviews = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    )
    setFiles((prev) => [...prev, ...filesWithPreviews])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true
  })

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (!accessToken || !workspaceId || files.length === 0) return

    setUploading(true)
    setStatus('Preparing files...')

    try {
      const encryptionKey = await getEncryptionKey()
      const encryptedFiles = await Promise.all(
        files.map(async (file) => {
          const encryptedData = await encryptFile(file, encryptionKey)
          return {
            filename: file.name,
            file: encryptedData,
            size: file.size,
            type: file.type
          }
        })
      )

      setStatus('Uploading...')

      // Use workspace-aware upload
      await uploadFilesBatch(encryptedFiles, accessToken, workspaceId)

      setStatus('Upload successful!')
      setFiles([])
      onUploadComplete?.()
      // Refresh storage quota
      refreshStorageQuota()
      toast.success('Files uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      setStatus('Upload failed')
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Selected Files:</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
              {uploading
                ? 'Uploading...'
                : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </Button>
            {status && <span className="text-sm text-gray-600">{status}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
