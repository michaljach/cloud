'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useUser } from '@repo/auth'
import { listUserFiles } from '@repo/api'
import { formatFileSize } from '@repo/utils'

export type FilesContextType = {
  files: any[]
  refreshFiles: () => void
}

export const FilesContext = createContext<FilesContextType>({
  files: [],
  refreshFiles: () => {}
})

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useUser()
  const [files, setFiles] = useState<any[]>([])

  const fetchFiles = useCallback(() => {
    if (!accessToken) return
    listUserFiles(accessToken)
      .then((files) => {
        setFiles(
          files.map((file) => ({
            id: file.filename,
            filename: file.filename,
            size: formatFileSize(file.size),
            modified: file.modified
          }))
        )
      })
      .catch(() => setFiles([]))
  }, [accessToken])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return (
    <FilesContext.Provider value={{ files, refreshFiles: fetchFiles }}>
      {children}
    </FilesContext.Provider>
  )
}
