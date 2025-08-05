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

interface LeaveWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  workspaceName: string
  isLeaving: boolean
}

export function LeaveWorkspaceDialog({
  open,
  onOpenChange,
  onConfirm,
  workspaceName,
  isLeaving
}: LeaveWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Leave Workspace
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to leave the workspace <strong>"{workspaceName}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">This action cannot be undone</p>
                <ul className="list-disc list-inside space-y-1 text-orange-700">
                  <li>You will lose access to all workspace content</li>
                  <li>You will be removed from all workspace discussions</li>
                  <li>You will need to be re-invited to rejoin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLeaving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLeaving}>
            {isLeaving ? 'Leaving...' : 'Leave Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
