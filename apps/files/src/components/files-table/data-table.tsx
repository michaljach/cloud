'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useContext, useMemo } from 'react'
import { FilesContext } from '../files-context'
import { Folder, File as FileIcon, ArrowLeft } from 'lucide-react'
import React from 'react'
import { useUser } from '@repo/auth'
import { uploadEncryptedUserFilesBatch, batchMoveUserFilesToTrash } from '@repo/api'
import { encryptFile } from '@repo/utils'

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
  const { accessToken } = useUser()
  const [dragActive, setDragActive] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = React.useState(false)

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
        setStatus('Login required to upload')
        return
      }
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const files = Array.from(e.dataTransfer.files) as File[]
      setStatus(`Encrypting ${files.length} file(s)...`)
      try {
        // Encrypt all files in parallel
        const encryptedFiles = await Promise.all(
          files.map(async (file) => {
            const encrypted = await encryptFile(file, HARDCODED_KEY)
            return { file: encrypted, filename: file.name }
          })
        )
        setStatus(`Uploading ${files.length} file(s)...`)
        const results = await uploadEncryptedUserFilesBatch(encryptedFiles, accessToken)
        const successCount = results.filter((r: any) => r.success).length
        const errorCount = results.length - successCount
        setStatus(`Upload complete! Success: ${successCount}, Failed: ${errorCount}`)
        refreshFiles()
      } catch (err: any) {
        setStatus(`Batch upload error: ${err.message}`)
      }
    }
  }

  // Get selected rows (files)
  const selectedRows = table.getSelectedRowModel().rows
  const selectedFiles = selectedRows.map((row) => row.original)

  // Batch delete handler (now only does the delete, not confirmation)
  const handleBatchDelete = async () => {
    if (!accessToken || selectedFiles.length === 0) return
    setStatus('Deleting selected files...')
    // Delete both files and folders
    const fileNamesToDelete = selectedFiles.map((f) =>
      currentPath ? `${currentPath}/${f.filename}` : f.filename
    )
    try {
      const results = await batchMoveUserFilesToTrash(fileNamesToDelete, accessToken)
      const successCount = results.filter((r: any) => r.success).length
      const errorCount = results.length - successCount
      setStatus(`Batch delete complete! Success: ${successCount}, Failed: ${errorCount}`)
    } catch (err: any) {
      setStatus(`Batch delete error: ${err.message}`)
    }
    refreshFiles()
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
      {status && <div className="text-sm text-muted-foreground mt-2">{status}</div>}
    </div>
  )
}
