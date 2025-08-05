'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/components/base/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import { addUserToWorkspace } from '@repo/api'
import type { Workspace, WorkspaceMember, User } from '@repo/types'
import { toast } from 'sonner'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace | null
  users: User[]
  workspaceMembers: WorkspaceMember[]
  accessToken: string
  onSuccess: () => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  workspace,
  users,
  workspaceMembers,
  accessToken,
  onSuccess
}: AddMemberDialogProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member')

  const handleAddMember = async () => {
    if (!accessToken || !workspace || !selectedUser) return

    try {
      await addUserToWorkspace(accessToken, workspace.id, selectedUser, selectedRole)
      setSelectedUser('')
      setSelectedRole('member')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add member')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Add a user to this workspace with a specific role.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((user) => !workspaceMembers.some((member) => member.userId === user.id))
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName || user.username}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <Select
              value={selectedRole}
              onValueChange={(value: 'owner' | 'admin' | 'member') => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddMember} disabled={!selectedUser}>
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
