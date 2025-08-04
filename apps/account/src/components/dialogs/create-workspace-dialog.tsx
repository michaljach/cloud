'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/base/button'
import { Input } from '@repo/ui/components/base/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import { createWorkspace } from '@repo/api'
import { toast } from 'sonner'

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  accessToken: string
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onSuccess,
  accessToken
}: CreateWorkspaceDialogProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateWorkspace = async () => {
    if (!accessToken || !newWorkspaceName.trim()) return

    setIsCreating(true)
    try {
      await createWorkspace(accessToken, newWorkspaceName.trim())
      setNewWorkspaceName('')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace for organizing users and resources.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateWorkspace} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
