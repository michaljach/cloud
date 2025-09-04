import { useState } from 'react'
import { encryptFile, getEncryptionKey } from '@repo/utils'

export interface FileUploadOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
  checkStorageQuota?: (files: File[]) => boolean | string
}

export interface FileUploadState {
  files: File[]
  status: string | null
  isUploading: boolean
}

export function useFileUpload(options: FileUploadOptions = {}) {
  const [state, setState] = useState<FileUploadState>({
    files: [],
    status: null,
    isUploading: false
  })

  const setStatus = (status: string | null) => {
    setState((prev) => ({ ...prev, status }))
  }

  const setFiles = (files: File[]) => {
    setState((prev) => ({ ...prev, files }))
  }

  const encryptFiles = async (files: File[]) => {
    setStatus('Encrypting...')
    try {
      const encryptionKey = getEncryptionKey()
      const encryptedFiles = await Promise.all(
        files.map(async (file) => {
          const encrypted = await encryptFile(file, encryptionKey)
          return { file: encrypted, filename: file.name }
        })
      )
      return encryptedFiles
    } catch (error: any) {
      const errorMessage = `Encryption failed: ${error.message}`
      setStatus(errorMessage)
      options.onError?.(errorMessage)
      throw error
    }
  }

  const validateFiles = (files: File[]) => {
    if (!files.length) {
      const errorMessage = 'No files selected'
      setStatus(errorMessage)
      options.onError?.(errorMessage)
      return false
    }

    if (options.checkStorageQuota) {
      const quotaCheck = options.checkStorageQuota(files)
      if (typeof quotaCheck === 'string') {
        setStatus(quotaCheck)
        options.onError?.(quotaCheck)
        return false
      }
      if (quotaCheck === false) {
        const errorMessage = 'Insufficient storage space'
        setStatus(errorMessage)
        options.onError?.(errorMessage)
        return false
      }
    }

    return true
  }

  const uploadFiles = async (
    files: File[],
    uploadFunction: (encryptedFiles: any[]) => Promise<void>
  ) => {
    if (!validateFiles(files)) {
      return
    }

    setState((prev) => ({ ...prev, isUploading: true }))

    try {
      const encryptedFiles = await encryptFiles(files)
      setStatus('Uploading...')

      await uploadFunction(encryptedFiles)

      setStatus('Upload successful!')
      setFiles([])
      options.onSuccess?.()
    } catch (error: any) {
      const errorMessage = `Upload failed: ${error.message}`
      setStatus(errorMessage)
      options.onError?.(errorMessage)
    } finally {
      setState((prev) => ({ ...prev, isUploading: false }))
    }
  }

  const reset = () => {
    setState({
      files: [],
      status: null,
      isUploading: false
    })
  }

  return {
    ...state,
    setStatus,
    setFiles,
    uploadFiles,
    reset
  }
}
