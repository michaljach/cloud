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
import { Download, MoreHorizontal } from 'lucide-react'
import { useUser } from '@repo/auth'
import { downloadEncryptedUserFile } from '@repo/api'
import { decryptFile } from '@repo/utils'

export type FileRow = {
  id: string
  filename: string
  size: string
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
    cell: ({ row }) => <div>{row.original.filename}</div>
  },
  {
    accessorKey: 'size',
    header: 'File Size',
    cell: ({ row }) => <div>{row.original.size || '—'}</div>
  },
  {
    id: 'download',
    header: () => <div className="text-right" />,
    cell: ({ row }) => {
      const file = row.original
      const { accessToken } = useUser()
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes
      const handleDownload = async () => {
        if (!accessToken) return
        const encrypted = await downloadEncryptedUserFile(file.filename, accessToken)
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
      }
      return (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Download file">
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
      const HARDCODED_KEY = new TextEncoder().encode('12345678901234567890123456789012') // 32 bytes

      const handleDownload = async () => {
        if (!accessToken) return
        const encrypted = await downloadEncryptedUserFile(file.filename, accessToken)
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
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(file.filename)}>
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
