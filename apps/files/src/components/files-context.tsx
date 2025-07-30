'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useUser, useWorkspace } from '@repo/contexts'
import { listFiles } from '@repo/api'
import { formatFileSize } from '@repo/utils'
import { usePathname, useRouter } from 'next/navigation'

export type FilesContextType = {
  files: any[]
  loading: boolean
  refreshFiles: () => void
  currentPath: string
  setCurrentPath: (path: string) => void
  trashedFiles: any[]
  refreshTrash: () => void
}

export const FilesContext = createContext<FilesContextType>({
  files: [],
  loading: true,
  refreshFiles: () => {},
  currentPath: '',
  setCurrentPath: () => {},
  trashedFiles: [],
  refreshTrash: () => {}
})

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [trashedFiles, setTrashedFiles] = useState<any[]>([])
  const pathname = usePathname()
  const router = useRouter()

  // Extract currentPath from the URL
  const currentPath = React.useMemo(() => {
    // Remove leading slash and decode
    const path = pathname.replace(/^\/|\/trash$/g, '')
    return path
  }, [pathname])

  const setCurrentPath = (path: string) => {
    // Push new URL to router
    router.push(path ? `/${path}` : '/')
  }

  const fetchFiles = useCallback(() => {
    if (!accessToken || !currentWorkspace) return
    setLoading(true)

    const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id

    listFiles(accessToken, currentPath, workspaceId)
      .then((items) => {
        setFiles(
          items
            .filter((item: any) => item.name !== '.trash') // Hide .trash folder
            .map((item: any) => ({
              id: item.name,
              filename: item.name,
              size: item.size,
              modified: item.modified,
              type: item.type
            }))
        )
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false))
  }, [accessToken, currentPath, currentWorkspace])

  const fetchTrash = useCallback(() => {
    if (!accessToken || !currentWorkspace) return

    import('@repo/api').then(({ listTrashedFiles }) => {
      const workspaceId = currentWorkspace.id === 'personal' ? undefined : currentWorkspace.id

      listTrashedFiles(accessToken, workspaceId)
        .then((items) => {
          setTrashedFiles(
            items.map((item: any) => ({
              id: item.filename || item.name,
              filename: item.filename || item.name,
              size: item.size,
              modified: item.modified,
              type: 'file'
            }))
          )
        })
        .catch(() => {
          setTrashedFiles([])
        })
        .finally(() => setLoading(false))
    })
  }, [accessToken, currentWorkspace])

  useEffect(() => {
    if (pathname === '/trash') {
      fetchTrash()
    } else {
      fetchFiles()
    }
  }, [fetchFiles, fetchTrash, pathname, currentWorkspace])

  return (
    <FilesContext.Provider
      value={{
        files,
        loading,
        refreshFiles: fetchFiles,
        currentPath,
        setCurrentPath,
        trashedFiles,
        refreshTrash: fetchTrash
      }}
    >
      {children}
    </FilesContext.Provider>
  )
}

export type TrashContextType = {
  trashedFiles: any[]
  refreshTrash: () => void
}

export const TrashContext = createContext<TrashContextType>({
  trashedFiles: [],
  refreshTrash: () => {}
})

export function TrashProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useUser()
  const [trashedFiles, setTrashedFiles] = useState<any[]>([])

  const fetchTrash = useCallback(() => {
    if (!accessToken) return
    import('@repo/api').then(({ listTrashedFiles }) => {
      listTrashedFiles(accessToken)
        .then((items) => setTrashedFiles(items))
        .catch(() => setTrashedFiles([]))
    })
  }, [accessToken])

  useEffect(() => {
    fetchTrash()
  }, [fetchTrash])

  return (
    <TrashContext.Provider value={{ trashedFiles, refreshTrash: fetchTrash }}>
      {children}
    </TrashContext.Provider>
  )
}
