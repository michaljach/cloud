'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useContext, useMemo } from 'react'
import { FilesContext } from '../files-context'
import { Folder, File as FileIcon, ArrowLeft, Download } from 'lucide-react'
import React from 'react'
import { useUser, useWorkspace } from '@repo/auth'
import { uploadFilesBatch, batchMoveFilesToTrash, downloadFile } from '@repo/api'
import { encryptFile, decryptFile } from '@repo/utils'
import JSZip from 'jszip'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/base/table'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@repo/ui/components/base/dropdown-menu'
import { Button } from '@repo/ui/components/base/button'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@repo/ui/components/base/dialog'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const { files, loading, currentPath, setCurrentPath, refreshFiles } = useContext(FilesContext)
  const { accessToken, refreshStorageQuota } = useUser()
  const { currentWorkspace } = useWorkspace()
  const [dragActive, setDragActive] = React.useState(false)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = React.useState(false)
  const [downloading, setDownloading] = React.useState(false)

  // Use provided data if available, otherwise use files from context
  const table = useReactTable({
    data: data ?? files,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  // Double-click handler for rows
  function handleRowDoubleClick(row: any) {
    if (row.original.type === 'folder') {
      setCurrentPath(
        currentPath ? `${currentPath}/${row.original.filename}` : row.original.filename
      )
    }
  }

  const isRoot = !currentPath

  // Skeleton loading component for table rows
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`skeleton-${index}`}>
          {Array.from({ length: columns.length }).map((_, cellIndex) => (
            <TableCell key={`skeleton-cell-${index}-${cellIndex}`}>
              <Skeleton className="h-8 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )

  // Drag and drop handlers for table
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
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (!accessToken) {
        toast.error('Login required to upload')
        return
      }
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const files = Array.from(e.dataTransfer.files) as File[]

      // Show initial toast
      const toastId = toast.loading(`Encrypting ${files.length} file(s)...`)

      try {
        // Read all files first to avoid permission issues
        const fileData = await Promise.all(
          files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer()
            return { file, arrayBuffer, filename: file.name }
          })
        )

        // Encrypt all files in parallel
        const encryptedFiles = await Promise.all(
          fileData.map(async ({ arrayBuffer, filename }) => {
            const encrypted = await encryptFile(new Uint8Array(arrayBuffer), HARDCODED_KEY)
            return { file: encrypted, filename }
          })
        )

        // Update toast to show upload progress
        toast.loading(`Uploading ${files.length} file(s)...`, { id: toastId })

        // Use unified upload
        const workspaceId = currentWorkspace?.id === 'personal' ? undefined : currentWorkspace?.id
        const results = await uploadFilesBatch(encryptedFiles, accessToken, workspaceId)
        const successCount = results.filter((r: any) => r.success).length
        const errorCount = results.length - successCount

        // Show success or partial success toast
        if (errorCount === 0) {
          toast.success(`Upload complete! Successfully uploaded ${successCount} file(s)`, {
            id: toastId
          })
        } else {
          toast.success(`Upload complete! Success: ${successCount}, Failed: ${errorCount}`, {
            id: toastId
          })
        }

        refreshFiles()
        // Refresh storage quota
        refreshStorageQuota()
      } catch (err: any) {
        toast.error(`Batch upload error: ${err.message}`, { id: toastId })
      }
    }
  }

  // Get selected rows (files)
  const selectedRows = table.getSelectedRowModel().rows
  const selectedFiles = selectedRows.map((row) => row.original)

  // Filter selected files to only include actual files (not folders)
  const selectedFileFiles = selectedFiles.filter((file) => file.type === 'file')

  // Batch download handler
  const handleBatchDownload = async () => {
    if (!accessToken || selectedFileFiles.length === 0) return

    setDownloading(true)

    const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes

    // Show initial toast
    const toastId = toast.loading(`Downloading ${selectedFileFiles.length} file(s)...`)

    try {
      // Download and decrypt all files in parallel
      const downloadPromises = selectedFileFiles.map(async (file) => {
        const fullPath = currentPath ? `${currentPath}/${file.filename}` : file.filename
        const workspaceId = currentWorkspace?.id === 'personal' ? undefined : currentWorkspace?.id
        const encrypted = await downloadFile(fullPath, accessToken, workspaceId)
        const decrypted = await decryptFile(encrypted, HARDCODED_KEY)
        return { filename: file.filename, data: decrypted }
      })

      const downloadedFiles = await Promise.all(downloadPromises)

      // Update toast to show zipping progress
      toast.loading(`Creating zip archive...`, { id: toastId })

      // Create zip file
      const zip = new JSZip()

      // Add each file to the zip
      downloadedFiles.forEach(({ filename, data }) => {
        zip.file(filename, data)
      })

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Download the zip file
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `files-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      // Show success toast
      toast.success(`Downloaded ${downloadedFiles.length} file(s) as zip successfully!`, {
        id: toastId
      })
    } catch (err: any) {
      // Show error toast
      toast.error(`Batch download error: ${err.message}`, { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  // Batch delete handler (now only does the delete, not confirmation)
  const handleBatchDelete = async () => {
    if (!accessToken || selectedFiles.length === 0) return

    // Show initial toast
    const toastId = toast.loading(`Deleting ${selectedFiles.length} file(s)...`)

    // Delete both files and folders
    const fileNamesToDelete = selectedFiles.map((f) =>
      currentPath ? `${currentPath}/${f.filename}` : f.filename
    )

    try {
      const workspaceId = currentWorkspace?.id === 'personal' ? undefined : currentWorkspace?.id
      const results = await batchMoveFilesToTrash(fileNamesToDelete, accessToken, workspaceId)

      const successCount = results.filter((r: any) => r.success).length
      const errorCount = results.length - successCount

      if (errorCount === 0) {
        toast.success(`Successfully moved ${successCount} file(s) to trash`, { id: toastId })
      } else {
        toast.success(`Batch delete complete! Success: ${successCount}, Failed: ${errorCount}`, {
          id: toastId
        })
      }
    } catch (err: any) {
      toast.error(`Batch delete error: ${err.message}`, { id: toastId })
    }
    refreshFiles()
    // Refresh storage quota
    refreshStorageQuota()
    table.resetRowSelection()
    setBatchDeleteDialogOpen(false)
  }

  return (
    <div
      className={`relative ${dragActive ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-100/80 pointer-events-none">
          <span className="text-lg font-semibold text-blue-700">Drop files to upload</span>
        </div>
      )}
      <div className="flex items-center gap-2 justify-between py-2">
        <div className="flex items-center gap-1">
          <Link
            className="font-semibold hover:underline"
            href="/"
            aria-current={isRoot ? 'page' : undefined}
          >
            Root
          </Link>
          {currentPath &&
            currentPath.split('/').map((segment, idx, arr) => {
              const path = arr.slice(0, idx + 1).join('/')
              const isLast = idx === arr.length - 1
              return (
                <span key={path} className="flex items-center gap-1">
                  <span className="mx-1 text-muted-foreground">/</span>
                  {isLast ? (
                    <span className="font-semibold text-muted-foreground">{segment}</span>
                  ) : (
                    <Link
                      href={`/${path}`}
                      className="text-blue-600 text-sm px-2 py-1 rounded no-underline hover:bg-accent hover:text-blue-800"
                    >
                      {segment}
                    </Link>
                  )}
                </span>
              )
            })}
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.length > 0 && (
            <>
              {selectedFileFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDownload}
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Selected ({selectedFileFiles.length})
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBatchDeleteDialogOpen(true)}
              >
                Delete Selected ({selectedFiles.length})
              </Button>
              <Dialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
                <DialogContent showCloseButton>
                  <DialogTitle>Move to Trash</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to move <b>{selectedFiles.length}</b> files to Trash? You
                    can restore them from Trash later.
                  </DialogDescription>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setBatchDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleBatchDelete}>
                      Move to Trash
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={() => column.toggleVisibility()}
                  >
                    {column.columnDef.header && typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border relative">
        {/* Show skeleton only if there is no data at all (first load) */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {files.length === 0 && loading ? (
              <TableSkeleton />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  className={row.original.type === 'folder' ? 'cursor-pointer' : ''}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
