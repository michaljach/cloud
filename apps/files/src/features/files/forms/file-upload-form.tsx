'use client'

import { uploadFilesBatch } from '@repo/api'
import { useUser, useWorkspace } from '@repo/providers'
import { encryptFile, getEncryptionKey } from '@repo/utils'
import React, { useState, useContext } from 'react'
import { toast } from 'sonner'

import { FilesContext } from '@/features/files/providers/files-context-provider'


export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { accessToken, refreshStorageQuota, user, storageQuota } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { refreshFiles } = useContext(FilesContext)

  const handleUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length || !accessToken || !currentWorkspace) {
      setStatus('File(s), login, and workspace context required')
      return
    }

    // Check storage limit before uploading
    if (user && storageQuota) {
      const totalFileSizeMB =
        selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
      const currentUsageMB = storageQuota.totalUsage.megabytes
      const storageLimitMB = user.storageLimit

      if (currentUsageMB + totalFileSizeMB > storageLimitMB) {
        const availableSpaceMB = storageLimitMB - currentUsageMB
        setStatus(`Error: Not enough storage space. Available: ${availableSpaceMB.toFixed(1)} MB`)
        return
      }
    }

    setStatus('Encrypting...')
    try {
      const encryptionKey = getEncryptionKey()
      const encryptedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const encrypted = await encryptFile(file, encryptionKey)
          return { file: encrypted, filename: file.name }
        })
      )
      setStatus('Uploading...')

      // Use workspace-aware upload

      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
      await uploadFilesBatch(encryptedFiles, accessToken, workspaceId)

      setStatus('Upload successful!')
      setFiles([])
      refreshFiles()
      // Refresh storage quota
      refreshStorageQuota()
      if (onUploaded) onUploaded()
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
      setStatus('Error: ' + err.message)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // This is required to allow dropping
    e.dataTransfer.dropEffect = 'copy'
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragActive to false if we're leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      setFiles(droppedFiles)
      handleUpload(droppedFiles)
    }
  }
  const handleClick = () => {
    inputRef.current?.click()
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : []
    if (selected.length > 0) {
      setFiles(selected)
      handleUpload(selected)
    }
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 border-2 rounded p-8 cursor-pointer transition-colors select-none text-center min-h-[200px] ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-muted'}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label="Open file picker"
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        accept="*/*"
      />
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl">{dragActive ? '📂' : '📁'}</div>
        <div className="text-sm text-muted-foreground">
          {dragActive
            ? 'Drop files here to upload'
            : status || 'Drop files here or click to browse'}
        </div>
        {files.length > 0 && (
          <div className="text-xs text-muted-foreground">{files.length} file(s) selected</div>
        )}
        {/* Debug info */}
        {currentWorkspace && (
          <div className="text-xs text-blue-600 mt-2">
            Current:{' '}
            {currentWorkspace.id === 'personal'
              ? 'Personal Space'
              : `Workspace: ${currentWorkspace.id}`}
          </div>
        )}
      </div>
    </div>
  )
}
