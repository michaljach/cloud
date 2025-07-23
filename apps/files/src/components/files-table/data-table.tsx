'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useContext, useMemo } from 'react'
import { FilesContext } from '../files-context'
import { Folder, File as FileIcon, ArrowLeft } from 'lucide-react'
import React from 'react'
import { useUser } from '@repo/auth'
import { uploadEncryptedUserFile } from '@repo/api'
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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data?: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const { files, loading, currentPath, setCurrentPath, refreshFiles } = useContext(FilesContext)
  const { accessToken } = useUser()
  const [dragActive, setDragActive] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)

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
      // After changing path, refresh files
      setTimeout(() => refreshFiles(), 0)
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (!accessToken) {
        setStatus('Login required to upload')
        return
      }
      setStatus('Encrypting...')
      try {
        const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
        const encrypted = await encryptFile(file, HARDCODED_KEY)
        setStatus('Uploading...')
        await uploadEncryptedUserFile(encrypted, file.name, accessToken)
        setStatus('Upload successful!')
        refreshFiles()
      } catch (err: any) {
        setStatus('Error: ' + err.message)
      }
    }
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
      <div className="rounded-md border">
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
            {loading ? (
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
