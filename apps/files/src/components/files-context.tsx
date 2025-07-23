'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useUser } from '@repo/auth'
import { listUserFiles } from '@repo/api'
import { formatFileSize } from '@repo/utils'
import { usePathname, useRouter } from 'next/navigation'

export type FilesContextType = {
  files: any[]
  refreshFiles: () => void
  currentPath: string
  setCurrentPath: (path: string) => void
}

export const FilesContext = createContext<FilesContextType>({
  files: [],
  refreshFiles: () => {},
  currentPath: '',
  setCurrentPath: () => {}
})

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useUser()
  const [files, setFiles] = useState<any[]>([])
  const pathname = usePathname()
  const router = useRouter()

  // Extract currentPath from the URL
  const currentPath = React.useMemo(() => {
    // Remove leading slash and decode
    const path = pathname.replace(/^\//, '')
    return path
  }, [pathname])

  const setCurrentPath = (path: string) => {
    // Push new URL to router
    router.push(path ? `/${path}` : '/')
  }

  const fetchFiles = useCallback(() => {
    if (!accessToken) return
    listUserFiles(accessToken, currentPath)
      .then((items) => {
        setFiles(
          items.map((item: any) => ({
            id: item.name,
            filename: item.name,
            size: item.size,
            modified: item.modified,
            type: item.type
          }))
        )
      })
      .catch(() => setFiles([]))
  }, [accessToken, currentPath])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return (
    <FilesContext.Provider value={{ files, refreshFiles: fetchFiles, currentPath, setCurrentPath }}>
      {children}
    </FilesContext.Provider>
  )
}
