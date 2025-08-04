'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, File, FileText, Image, Video, Music } from 'lucide-react'
import { Button } from '@repo/ui/components/base/button'
import { useUser, useWorkspace } from '@repo/contexts'
import { downloadFile } from '@repo/api'
import { decryptFile, getEncryptionKey } from '@repo/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/base/dialog'

interface FilePreviewDialogProps {
  filename: string
  filePath: string
  isOpen: boolean
  onClose: () => void
}

export function FilePreviewDialog({ filename, filePath, isOpen, onClose }: FilePreviewDialogProps) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')

  const workspaceId = currentWorkspace?.id

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension || '')) {
      return <Video className="h-8 w-8 text-purple-500" />
    }
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension || '')) {
      return <Music className="h-8 w-8 text-green-500" />
    }
    if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html'].includes(extension || '')) {
      return <FileText className="h-8 w-8 text-orange-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const loadFileContent = async () => {
    if (!accessToken || !workspaceId) return

    setLoading(true)
    setError(null)

    try {
      const encryptedData = await downloadFile(accessToken, workspaceId, filePath)
      const encryptionKey = await getEncryptionKey()
      const decryptedData = await decryptFile(encryptedData, encryptionKey)

      // Convert ArrayBuffer to string for text files
      const textDecoder = new TextDecoder()
      const textContent = textDecoder.decode(decryptedData)

      setContent(textContent)
      setFileType(filename.split('.').pop()?.toLowerCase() || '')
    } catch (err) {
      setError('Failed to load file content')
      console.error('Error loading file:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!accessToken || !workspaceId) return

    try {
      const encryptedData = await downloadFile(accessToken, workspaceId, filePath)
      const encryptionKey = await getEncryptionKey()
      const decryptedData = await decryptFile(encryptedData, encryptionKey)

      // Create download link
      const blob = new Blob([decryptedData])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadFileContent()
    } else {
      setContent(null)
      setError(null)
    }
  }, [isOpen, filePath])

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center p-8">Loading...</div>
    }

    if (error) {
      return <div className="flex justify-center p-8 text-red-500">{error}</div>
    }

    if (!content) {
      return <div className="flex justify-center p-8">No content to display</div>
    }

    // For text files, show content
    if (['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'css', 'html'].includes(fileType)) {
      return <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-96">{content}</pre>
    }

    // For images, show image
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType)) {
      return (
        <div className="flex justify-center">
          <img
            src={`data:image/${fileType};base64,${btoa(content)}`}
            alt={filename}
            className="max-w-full max-h-96 object-contain"
          />
        </div>
      )
    }

    // For other files, show file info
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        {getFileIcon(filename)}
        <h3 className="mt-4 text-lg font-medium">{filename}</h3>
        <p className="text-gray-500 mt-2">This file type cannot be previewed</p>
        <Button onClick={handleDownload} className="mt-4">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(filename)}
              <span>{filename}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
