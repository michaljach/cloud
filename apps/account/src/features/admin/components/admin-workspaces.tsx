'use client'

import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@repo/ui/components/base/table'
import { useUser } from '@repo/providers'
import { Button } from '@repo/ui/components/base/button'
import { Icon } from '@repo/ui/components/base/icons'
import { WorkspaceEditDialog } from '@/features/workspaces/dialogs/workspace-edit-dialog'
import { CreateWorkspaceDialog } from '@/features/workspaces/dialogs/create-workspace-dialog'
import { WorkspaceMembersDialog } from '@/features/workspaces/dialogs/workspace-members-dialog'
import {
  AdminWorkspacesProvider,
  useAdminWorkspaces
} from '@/features/admin/providers/admin-workspaces-provider'
import type { Workspace } from '@repo/types'

// Utility function to check if user is root admin
const SYSTEM_ADMIN_WORKSPACE_ID = 'system-admin-workspace'

function isRootAdmin(user: any): boolean {
  return (
    user?.workspaces?.some(
      (uw: any) => uw.role === 'owner' && uw.workspace.id === SYSTEM_ADMIN_WORKSPACE_ID
    ) ?? false
  )
}

export function AdminWorkspacesContent() {
  const { user, loading, accessToken } = useUser()
  const { workspaces, users, error, refreshWorkspaces } = useAdminWorkspaces()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  const handleViewMembers = (workspace: Workspace) => {
    setSelectedWorkspace(workspace)
    setMembersDialogOpen(true)
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

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshWorkspaces}
        accessToken={accessToken || ''}
      />

      <WorkspaceMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        workspace={selectedWorkspace}
        users={users}
        accessToken={accessToken || ''}
      />

      <WorkspaceEditDialog
        workspace={selectedWorkspace}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshWorkspaces}
      />
    </div>
  )
}
