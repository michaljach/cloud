'use client'

import { Button } from '@repo/ui/components/base/button'
import { Checkbox } from '@repo/ui/components/base/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@repo/ui/components/base/dropdown-menu'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@repo/ui/components/base/dialog'
import { ColumnDef } from '@tanstack/react-table'
import { Download, MoreHorizontal, Folder as FolderIcon, File as FileIcon } from 'lucide-react'
import { useUser } from '@repo/providers'
import { downloadEncryptedUserFile, batchMoveUserFilesToTrash } from '@repo/api'

import { formatDate, formatFileSize, decryptFile, getEncryptionKey } from '@repo/utils'
import { useContext } from 'react'
import { FilesContext } from '@/features/files/providers/files-context-provider'
import React from 'react'

export type FileRow = {
  id: string
  filename: string
  size?: string | number
  modified: string
  type: 'file' | 'folder'
}

export const columns: ColumnDef<FileRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onDoubleClick={(e) => e.stopPropagation()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onDoubleClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'filename',
    header: 'Filename',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.type === 'folder' ? (
          <FolderIcon className="w-4 h-4 text-yellow-600" />
        ) : (
          <FileIcon className="w-4 h-4 text-blue-600" />
        )}
        <span>{row.original.filename}</span>
      </div>
    )
  },
  {
    accessorKey: 'size',
    header: 'File Size',
    cell: ({ row }) => {
      if (row.original.type !== 'file') return <div>—</div>
      const size = row.original.size
      if (typeof size === 'number') {
        return <div>{formatFileSize(size)}</div>
      }
      // fallback for string or missing
      const parsed = Number(size)
      return <div>{!isNaN(parsed) && parsed > 0 ? formatFileSize(parsed) : '—'}</div>
    }
  },
  {
    accessorKey: 'modified',
    header: 'Date Modified',
    cell: ({ row }) => {
      const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
      return (
        <div>
          {row.original.modified
            ? formatDate(row.original.modified, locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '—'}
        </div>
      )
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <div className="text-right" />,
    cell: ({ row }) => {
      const file = row.original
      const { accessToken, refreshStorageQuota } = useUser()
      const { currentPath, refreshFiles } = useContext(FilesContext)
      const [dialogOpen, setDialogOpen] = React.useState(false)
      const fullPath = currentPath ? `${currentPath}/${file.filename}` : file.filename
      const handleDownload = async () => {
        if (!accessToken) return
        if (file.type === 'file') {
          const encryptionKey = getEncryptionKey()
          const encrypted = await downloadEncryptedUserFile(fullPath, accessToken)
          const decrypted = await decryptFile(encrypted, encryptionKey)
          const blob = new Blob([decrypted])
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.filename
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 100)
        }
      }
      return (
        <div className="flex justify-end items-center">
          {file.type === 'file' && (
            <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download">
              <Download />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(fullPath)}>
                Copy filename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {file.type === 'file' && (
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setDialogOpen(true)}>
                <span className="text-red-500">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent showCloseButton className="max-w-lg">
              <DialogTitle>Move to Trash</DialogTitle>
              <DialogDescription>
                Are you sure you want to move <b>{file.filename}</b> to Trash? You can restore it
                from Trash later.
              </DialogDescription>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!accessToken) return
                    await batchMoveUserFilesToTrash([fullPath], accessToken)
                    setDialogOpen(false)
                    if (typeof refreshFiles === 'function') refreshFiles()
                    // Refresh storage quota
                    refreshStorageQuota()
                  }}
                >
                  Move to Trash
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    }
  }
]
