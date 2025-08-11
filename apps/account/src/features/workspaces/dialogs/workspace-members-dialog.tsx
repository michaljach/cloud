'use client'

import { getWorkspaceMembers, updateUserWorkspaceRole, removeUserFromWorkspace } from '@repo/api'
import { Button } from '@repo/ui/components/base/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import { Icon } from '@repo/ui/components/base/icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@repo/ui/components/base/table'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { AddMemberDialog } from './add-member-dialog'
import { RemoveMemberDialog } from './remove-member-dialog'

import type { Workspace, WorkspaceMember, User } from '@repo/types'


interface WorkspaceMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace: Workspace | null
  users: User[]
  accessToken: string
}

export function WorkspaceMembersDialog({
  open,
  onOpenChange,
  workspace,
  users,
  accessToken
}: WorkspaceMembersDialogProps) {
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)

  const loadWorkspaceMembers = async (workspaceId: string) => {
    if (!accessToken) return
    setIsLoadingMembers(true)
    try {
      const members = await getWorkspaceMembers(accessToken, workspaceId)
      setWorkspaceMembers(members)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch workspace members')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    if (!accessToken || !workspace) return

    try {
      await updateUserWorkspaceRole(accessToken, workspace.id, userId, newRole)
      await loadWorkspaceMembers(workspace.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!accessToken || !workspace) return

    try {
      await removeUserFromWorkspace(accessToken, workspace.id, userId)
      await loadWorkspaceMembers(workspace.id)
      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleAddMemberSuccess = () => {
    if (workspace) {
      loadWorkspaceMembers(workspace.id)
    }
  }

  useEffect(() => {
    if (open && workspace) {
      loadWorkspaceMembers(workspace.id)
    }
  }, [open, workspace, accessToken])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{workspace?.name} - Members</DialogTitle>
            <DialogDescription>Manage workspace members and their roles.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Members</h3>
              <Button onClick={() => setAddMemberDialogOpen(true)}>
                <Icon.Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            {isLoadingMembers ? (
              <div>Loading members...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaceMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.user.fullName || member.user.username}
                          </div>
                          <div className="text-sm text-gray-500">{member.user.username}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value: 'owner' | 'admin' | 'member') =>
                            handleUpdateRole(member.userId, value)
                          }
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMemberToRemove(member)
                            setRemoveMemberDialogOpen(true)
                          }}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMemberDialog
        open={addMemberDialogOpen}
        onOpenChange={setAddMemberDialogOpen}
        workspace={workspace}
        users={users}
        workspaceMembers={workspaceMembers}
        accessToken={accessToken}
        onSuccess={handleAddMemberSuccess}
      />

      <RemoveMemberDialog
        open={removeMemberDialogOpen}
        onOpenChange={setRemoveMemberDialogOpen}
        onConfirm={() => {
          if (memberToRemove) {
            handleRemoveMember(memberToRemove.userId)
          }
        }}
        memberName={memberToRemove?.user.username || ''}
        workspaceName={workspace?.name || ''}
        isRemoving={false}
      />
    </>
  )
}
