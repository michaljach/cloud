'use client'

import { downloadEncryptedUserFile } from '@repo/api'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@repo/ui/components/base/dialog'
import { decryptFile, getEncryptionKey } from '@repo/utils'
import { Download, X, FileText, Image as ImageIcon } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { getFileType } from '@/utils/fileTypeDetection'

interface FilePreviewProps {
  isOpen: boolean
  onClose: () => void
  filename: string
  filePath: string
}

export function FilePreview({ isOpen, onClose, filename, filePath }: FilePreviewProps) {
  const { accessToken } = useUser()
  const [content, setContent] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileType = getFileType(filename)

  // Always try to load the file, even if it's not a previewable type

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFileContent()
    }
  }, [isOpen, accessToken, filePath])

  const loadFileContent = async () => {
    if (!accessToken) return

    setLoading(true)
    setError(null)

    try {
      const encryptionKey = getEncryptionKey()
      const encrypted = await downloadEncryptedUserFile(filePath, accessToken)
      const decrypted = await decryptFile(encrypted, encryptionKey)

      if (fileType === 'text') {
        // Convert Uint8Array to string for text files
        const textContent = new TextDecoder().decode(decrypted)
        setContent(textContent)
        setImageUrl(null)
      } else if (fileType === 'image') {
        // Create blob URL for image files
        const blob = new Blob([decrypted])
        const url = URL.createObjectURL(blob)
        setImageUrl(url)
        setContent(null)
      } else {
        // For other file types, show a generic preview
        setContent(null)
        setImageUrl(null)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file content'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!accessToken) return

    try {
      const encryptionKey = getEncryptionKey()
      const encrypted = await downloadEncryptedUserFile(filePath, accessToken)
      const decrypted = await decryptFile(encrypted, encryptionKey)
      const blob = new Blob([decrypted])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      toast.success('File downloaded successfully')
    } catch (err: unknown) {
      toast.error('Failed to download file')
    }
  }

  const handleClose = () => {
    // Clean up blob URL if it exists
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
      setImageUrl(null)
    }
    setContent(null)
    setError(null)
    onClose()
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading file...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )
    }

    if (fileType === 'text' && content !== null) {
      return (
        <div className="h-full">
          <pre className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap font-mono">
            {content}
          </pre>
        </div>
      )
    }

    if (fileType === 'image' && imageUrl) {
      return (
        <div className="flex items-center justify-center">
          <img
            src={imageUrl}
            alt={filename}
            className="max-w-full max-h-96 object-contain rounded-md"
          />
        </div>
      )
    }

    // For other file types, show a generic preview
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
          <p className="text-xs text-muted-foreground mt-1">
            Use the download button to save the file
          </p>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {fileType === 'text' ? (
              <FileText className="w-5 h-5 text-blue-600" />
            ) : fileType === 'image' ? (
              <ImageIcon className="w-5 h-5 text-green-600" />
            ) : (
              <FileText className="w-5 h-5 text-gray-600" />
            )}
            <DialogTitle className="text-lg">{filename}</DialogTitle>
          </div>
        </div>

        <DialogDescription className="sr-only">File preview for {filename}</DialogDescription>

        <div className="flex-1 overflow-auto min-h-0">{renderContent()}</div>

        <DialogFooter className="mt-4 flex-shrink-0">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
