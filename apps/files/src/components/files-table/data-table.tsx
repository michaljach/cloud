'use client'

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useContext, useMemo } from 'react'
import { FilesContext } from '../files-context'
import { Folder, File as FileIcon, ArrowLeft } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/base/table'
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
  const { files, currentPath, setCurrentPath, refreshFiles } = useContext(FilesContext)

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

  // Go up one level
  function goUp() {
    if (!currentPath) return
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.join('/'))
    setTimeout(() => refreshFiles(), 0)
  }

  const isRoot = !currentPath

  return (
    <>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  className={row.original.type === 'folder' ? 'cursor-pointer hover:bg-accent' : ''}
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
    </>
  )
}
