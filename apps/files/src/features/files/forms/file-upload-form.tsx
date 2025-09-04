'use client'

import { uploadFilesBatch } from '@repo/api'
import { useUser, useWorkspace } from '@repo/providers'
import { useFileUpload } from '@repo/ui/hooks/useFileUpload'
import { useDragAndDrop } from '@repo/ui/hooks/useDragAndDrop'
import React, { useContext, useRef } from 'react'
import { toast } from 'sonner'

import { FilesContext } from '@/features/files/providers/files-context-provider'

export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { accessToken, refreshStorageQuota, user, storageQuota } = useUser()
  const { currentWorkspace } = useWorkspace()
  const { refreshFiles } = useContext(FilesContext)

  const checkStorageQuota = (selectedFiles: File[]) => {
    if (user && storageQuota) {
      const totalFileSizeMB =
        selectedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)
      const currentUsageMB = storageQuota.totalUsage.megabytes
      const storageLimitMB = user.storageLimit

      if (currentUsageMB + totalFileSizeMB > storageLimitMB) {
        const availableSpaceMB = storageLimitMB - currentUsageMB
        return `Error: Not enough storage space. Available: ${availableSpaceMB.toFixed(1)} MB`
      }
    }
    return true
  }

  const { files, status, isUploading, setFiles, uploadFiles } = useFileUpload({
    onSuccess: () => {
      refreshFiles()
      refreshStorageQuota()
      if (onUploaded) onUploaded()
    },
    onError: (error: string) => {
      toast.error('Upload failed: ' + error)
    },
    checkStorageQuota
  })

  const { isDragActive, getDropZoneProps } = useDragAndDrop({
    onFilesDrop: (droppedFiles: File[]) => {
      setFiles(droppedFiles)
      handleUpload(droppedFiles)
    }
  })

  const handleUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length || !accessToken || !currentWorkspace) {
      return
    }

    await uploadFiles(
      selectedFiles,
      async (encryptedFiles: Array<{ file: File; filename: string }>) => {
        const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id
        await uploadFilesBatch(encryptedFiles, accessToken, workspaceId)
      }
    )
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
      className={`flex flex-col items-center justify-center gap-2 border-2 rounded p-8 cursor-pointer transition-colors select-none text-center min-h-[200px] ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-muted'}`}
      {...getDropZoneProps()}
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
        <div className="text-4xl">{isDragActive ? '📂' : '📁'}</div>
        <div className="text-sm text-muted-foreground">
          {isDragActive
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
