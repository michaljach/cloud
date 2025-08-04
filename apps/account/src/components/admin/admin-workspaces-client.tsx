'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@repo/ui/components/base/table'
import { useUser } from '@repo/contexts'
import {
  getWorkspaces,
  createWorkspace,
  getWorkspaceMembers,
  addUserToWorkspace,
  updateUserWorkspaceRole,
  removeUserFromWorkspace,
  getUsers
} from '@repo/api'
import { Button } from '@repo/ui/components/base/button'
import { Icon } from '@repo/ui/components/base/icons'
import { Input } from '@repo/ui/components/base/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@repo/ui/components/base/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { WorkspaceEditDialog } from '@/components/dialogs/workspace-edit-dialog'
import { RemoveMemberDialog } from '@/components/dialogs/remove-member-dialog'
import type { Workspace, WorkspaceMember, User } from '@repo/types'
import { toast } from 'sonner'

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

export function AdminWorkspacesClient() {
  const { user, loading, accessToken } = useUser()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState<'owner' | 'admin' | 'member'>('member')
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)

  const refreshWorkspaces = async () => {
    if (!accessToken) return
    try {
      const fetchedWorkspaces = await getWorkspaces(accessToken)
      setWorkspaces(fetchedWorkspaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces')
    }
  }

  const refreshUsers = async () => {
    if (!accessToken) return
    try {
      const fetchedUsers = await getUsers(accessToken)
      setUsers(fetchedUsers)
    } catch (err) {
      toast.error('Failed to fetch users')
    }
  }

  const loadWorkspaceMembers = async (workspaceId: string) => {
    if (!accessToken) return
    setIsLoadingMembers(true)
    try {
      const members = await getWorkspaceMembers(accessToken, workspaceId)
      setWorkspaceMembers(members)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace members')
    } finally {
      setIsLoadingMembers(false)
    }
  }

  useEffect(() => {
    if (!user || !accessToken) return

    // Check if user is root admin
    const userIsRootAdmin = isRootAdmin(user)

    if (!user || !userIsRootAdmin) {
      setError('Forbidden')
      return
    }

    refreshWorkspaces()
    refreshUsers()
  }, [user, accessToken])

  const handleCreateWorkspace = async () => {
    if (!accessToken || !newWorkspaceName.trim()) return

    setIsCreating(true)
    try {
      await createWorkspace(accessToken, newWorkspaceName.trim())
      setNewWorkspaceName('')
      setCreateDialogOpen(false)
      refreshWorkspaces()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setIsCreating(false)
    }
  }

  const handleViewMembers = async (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setMembersDialogOpen(true)
    await loadWorkspaceMembers(workspace.id)
  }

  const handleAddMember = async () => {
    if (!accessToken || !selectedWorkspace || !selectedUser) return

    try {
      await addUserToWorkspace(accessToken, selectedWorkspace.id, selectedUser, selectedRole)
      setSelectedUser('')
      setSelectedRole('member')
      setAddMemberDialogOpen(false)
      await loadWorkspaceMembers(selectedWorkspace.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    if (!accessToken || !selectedWorkspace) return

    try {
      await updateUserWorkspaceRole(accessToken, selectedWorkspace.id, userId, newRole)
      await loadWorkspaceMembers(selectedWorkspace.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!accessToken || !selectedWorkspace) return

    try {
      await removeUserFromWorkspace(accessToken, selectedWorkspace.id, userId)
      await loadWorkspaceMembers(selectedWorkspace.id)
      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleEditWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setEditDialogOpen(true)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  // Check if user is root admin
  const userIsRootAdmin = isRootAdmin(user)

  if (!user || !userIsRootAdmin) return <div>Access denied</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Icon.Plus className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaces.map((workspace) => (
            <TableRow key={workspace.id}>
              <TableCell>{workspace.name}</TableCell>
              <TableCell className="font-mono text-sm">{workspace.id}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditWorkspace(workspace)}
                  >
                    <Icon.Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleViewMembers(workspace)}>
                    View Members
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Workspace Modal */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workspace Members Modal */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedWorkspace?.name} - Members</DialogTitle>
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
            <Button onClick={() => setMembersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a user to this workspace with a specific role.
            </DialogDescription>
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

            {error && <div className="text-sm text-red-600">{error}</div>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!selectedUser}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Workspace Edit Modal */}
      <WorkspaceEditDialog
        workspace={selectedWorkspace}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshWorkspaces}
      />

      {/* Remove Member Dialog */}
      <RemoveMemberDialog
        open={removeMemberDialogOpen}
        onOpenChange={setRemoveMemberDialogOpen}
        onConfirm={() => {
          if (memberToRemove) {
            handleRemoveMember(memberToRemove.userId)
          }
        }}
        memberName={memberToRemove?.user.username || ''}
        workspaceName={selectedWorkspace?.name || ''}
        isRemoving={false}
      />
    </div>
  )
}
