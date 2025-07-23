'use client'

import React, { useState, useContext } from 'react'
import { useUser } from '@repo/auth'
import { uploadEncryptedUserFile } from '@repo/api'
import { encryptFile } from '@repo/utils'
import { FilesContext } from './files-context'

export function FileUpload({ onUploaded }: { onUploaded?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { accessToken } = useUser()
  const { refreshFiles } = useContext(FilesContext)

  const handleUpload = async (selectedFile: File) => {
    if (!selectedFile || !accessToken) {
      setStatus('File and login required')
      return
    }
    setStatus('Encrypting...')
    try {
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const encrypted = await encryptFile(selectedFile, HARDCODED_KEY)
      setStatus('Uploading...')
      await uploadEncryptedUserFile(encrypted, selectedFile.name, accessToken)
      setStatus('Upload successful!')
      setFile(null)
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      handleUpload(e.dataTransfer.files[0])
    }
  }
  const handleClick = () => {
    inputRef.current?.click()
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
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
      <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={handleInputChange} />
      <span className="text-lg font-semibold">Drop files here or click to upload</span>
      <span className="text-xs text-muted-foreground">
        All uploaded files are securely encrypted.
      </span>
      {file && <span className="text-xs text-foreground">Selected: {file.name}</span>}
      {status && <div className="text-sm text-muted-foreground">{status}</div>}
    </div>
  )
}
