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
import { ColumnDef } from '@tanstack/react-table'
import { Download, MoreHorizontal, Folder as FolderIcon, File as FileIcon } from 'lucide-react'
import { useUser } from '@repo/auth'
import { downloadEncryptedUserFile, downloadUserFolder } from '@repo/api'
import { decryptFile } from '@repo/utils'
import { formatDate, formatFileSize } from '@repo/utils'
import { useContext } from 'react'
import { FilesContext } from '../files-context'

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
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
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
    id: 'download',
    header: () => <div className="text-right" />,
    cell: ({ row }) => {
      const file = row.original
      const { accessToken } = useUser()
      const { currentPath } = useContext(FilesContext)
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const fullPath = currentPath ? `${currentPath}/${file.filename}` : file.filename
      const handleDownload = async () => {
        if (!accessToken) return
        if (file.type === 'file') {
          const encrypted = await downloadEncryptedUserFile(fullPath, accessToken)
          const decrypted = await decryptFile(encrypted, HARDCODED_KEY)
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
        } else if (file.type === 'folder') {
          await downloadUserFolder(accessToken, fullPath)
        }
      }
      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download">
            <Download />
          </Button>
        </div>
      )
    },
    enableHiding: false
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <div className="text-right" />,
    cell: ({ row }) => {
      const file = row.original
      const { accessToken } = useUser()
      const { currentPath } = useContext(FilesContext)
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const fullPath = currentPath ? `${currentPath}/${file.filename}` : file.filename
      const handleDownload = async () => {
        if (!accessToken) return
        if (file.type === 'file') {
          const encrypted = await downloadEncryptedUserFile(fullPath, accessToken)
          const decrypted = await decryptFile(encrypted, HARDCODED_KEY)
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
        } else if (file.type === 'folder') {
          await downloadUserFolder(accessToken, fullPath)
        }
      }
      return (
        <div className="flex justify-end">
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
              <DropdownMenuItem onClick={handleDownload}>Download</DropdownMenuItem>
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  }
]
