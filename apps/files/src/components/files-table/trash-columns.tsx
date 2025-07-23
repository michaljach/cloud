import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@repo/ui/components/base/button'
import { useUser } from '@repo/auth'
import { restoreUserFileFromTrash, deleteUserFileFromTrash } from '@repo/api'
import { formatFileSize, formatDate } from '@repo/utils'
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@repo/ui/components/base/dialog'

export function getTrashColumns(refresh: () => void): ColumnDef<any, any>[] {
  return [
    {
      accessorKey: 'filename',
      header: 'Filename',
      cell: ({ row }) => row.original.filename
    },
    {
      accessorKey: 'size',
      header: 'File Size',
      cell: ({ row }) => formatFileSize(row.original.size)
    },
    {
      accessorKey: 'modified',
      header: 'Date Deleted',
      cell: ({ row }) => {
        const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
        return row.original.modified
          ? formatDate(row.original.modified, locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—'
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const { accessToken } = useUser()
        const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false)
        const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
        const handleRestore = async () => {
          if (!accessToken) return
          await restoreUserFileFromTrash(row.original.filename, accessToken)
          setRestoreDialogOpen(false)
          refresh()
        }
        const handleDelete = async () => {
          if (!accessToken) return
          await deleteUserFileFromTrash(row.original.filename, accessToken)
          setDeleteDialogOpen(false)
          refresh()
        }
        return (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setRestoreDialogOpen(true)}>
              Restore
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              Delete
            </Button>
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
              <DialogContent showCloseButton>
                <DialogTitle>Restore File</DialogTitle>
                <DialogDescription>
                  Are you sure you want to restore <b>{row.original.filename}</b> from Trash?
                </DialogDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" onClick={handleRestore}>
                    Restore
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent showCloseButton>
                <DialogTitle>Permanently Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to permanently delete <b>{row.original.filename}</b>? This
                  action cannot be undone.
                </DialogDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )
      }
    }
  ]
}
