'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import { Button } from '@repo/ui/components/base/button'
import { AlertTriangle } from 'lucide-react'

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  memberName: string
  workspaceName: string
  isRemoving: boolean
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  onConfirm,
  memberName,
  workspaceName,
  isRemoving
}: RemoveMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove Member
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{memberName}</strong> from{' '}
            <strong>{workspaceName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>This action will:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Remove the user from all workspace activities</li>
              <li>Revoke their access to workspace resources</li>
              <li>Cannot be undone immediately</li>
            </ul>
            <p className="text-destructive font-medium mt-4">
              The user will need to be re-invited if you want them to rejoin later.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRemoving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isRemoving}>
            {isRemoving ? 'Removing...' : 'Remove Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
