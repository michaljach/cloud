'use client'

import { Button } from '@repo/ui/components/base/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@repo/ui/components/base/dialog'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useNotes } from '@/features/notes/providers/notes-provider'

interface DeleteNoteDialogProps {
  filename: string
  title: string
  onDeleted?: () => void
  trigger?: React.ReactNode
}

export function DeleteNoteDialog({ filename, title, onDeleted, trigger }: DeleteNoteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteNoteFile } = useNotes()

  const handleDelete = async () => {
    if (!filename) return

    setIsDeleting(true)
    try {
      await deleteNoteFile(filename)
      toast.success('Note deleted successfully')
      setOpen(false)
      onDeleted?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete note</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete Note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
