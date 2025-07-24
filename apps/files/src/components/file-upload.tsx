'use client'

import React, { useState, useContext } from 'react'
import { useUser } from '@repo/auth'
import { uploadEncryptedUserFilesBatch } from '@repo/api'
import { encryptFile } from '@repo/utils'
import { FilesContext } from './files-context'

export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { accessToken } = useUser()
  const { refreshFiles } = useContext(FilesContext)

  const handleUpload = async (selectedFiles: File[]) => {
    if (!selectedFiles.length || !accessToken) {
      setStatus('File(s) and login required')
      return
    }
    setStatus('Encrypting...')
    try {
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const encryptedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const encrypted = await encryptFile(file, HARDCODED_KEY)
          return { file: encrypted, filename: file.name }
        })
      )
      setStatus('Uploading...')
      await uploadEncryptedUserFilesBatch(encryptedFiles, accessToken)
      setStatus('Upload successful!')
      setFiles([])
      refreshFiles()
      if (onUploaded) onUploaded()
    } catch (err: any) {
      setStatus('Error: ' + err.message)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
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
      className={`flex flex-col items-center justify-center gap-2 border-2 rounded p-8 cursor-pointer transition-colors select-none text-center ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-dashed border-muted'}`}
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
        style={{ display: 'none' }}
        onChange={handleInputChange}
        multiple
      />
      <span className="text-lg font-semibold">Drop files here or click to upload</span>
      <span className="text-xs text-muted-foreground">
        All uploaded files are securely encrypted.
      </span>
      {files.length > 0 && (
        <span className="text-xs text-foreground">
          Selected: {files.map((f) => f.name).join(', ')}
        </span>
      )}
      {status && <div className="text-sm text-muted-foreground">{status}</div>}
    </div>
  )
}
