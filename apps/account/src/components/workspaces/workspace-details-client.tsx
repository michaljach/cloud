'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@repo/contexts'
import { convertUserWorkspaceToMembership } from '@repo/utils'
import {
  getWorkspaceMembers,
  updateUserWorkspaceRole,
  removeUserFromWorkspace,
  leaveWorkspace
} from '@repo/api'
import { useParams } from 'next/navigation'
import { WorkspaceEditDialog } from '@/components/dialogs/workspace-edit-dialog'
import { WorkspaceInviteDialog } from '@/components/dialogs/workspace-invite-dialog'
import { LeaveWorkspaceDialog } from '@/components/dialogs/leave-workspace-dialog'
import { RemoveMemberDialog } from '@/components/dialogs/remove-member-dialog'
import { WorkspaceHeader } from './workspace-header'
import { WorkspaceInfoCard } from '@/components/cards/workspace-info-card'
import { WorkspaceStatsCard } from '@/components/cards/workspace-stats-card'
import { WorkspaceMembersTable } from '@/components/tables/workspace-members-table'
import type { WorkspaceMembership, WorkspaceMember } from '@repo/types'

export function WorkspaceDetailsClient() {
  const { user, loading, accessToken } = useUser()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspaceMembership, setWorkspaceMembership] = useState<WorkspaceMembership | null>(null)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [isLeavingWorkspace, setIsLeavingWorkspace] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)

  const refreshWorkspaceData = useCallback(async () => {
    if (!user || !accessToken) return

    try {
      // Get user's workspace memberships from user object
      const userWorkspaces = user.workspaces || []
      const userMembership = userWorkspaces.find((uw: any) => uw.workspaceId === workspaceId)

      if (!userMembership) {
        setError('You are not a member of this workspace')
        return
      }

      // Convert UserWorkspace to WorkspaceMembership format
      const membership = convertUserWorkspaceToMembership(userMembership)

      setWorkspaceMembership(membership)

      // Get workspace members
      setIsLoadingMembers(true)
      const members = await getWorkspaceMembers(accessToken, workspaceId)
      setWorkspaceMembers(members)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspace data')
    } finally {
      setIsLoadingMembers(false)
    }
  }, [user, accessToken, workspaceId])

  const handleUpdateRole = async (userId: string, newRole: 'owner' | 'admin' | 'member') => {
    if (!accessToken || !workspaceId) return

    setIsUpdatingRole(true)
    setError(null) // Clear any previous errors
    try {
      await updateUserWorkspaceRole(accessToken, workspaceId, userId, newRole)
      await refreshWorkspaceData()
      setEditingMemberId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!accessToken) return
    try {
      setIsUpdatingRole(true)
      setError(null)
      await removeUserFromWorkspace(accessToken, workspaceId, userId)
      await refreshWorkspaceData()
      setRemoveMemberDialogOpen(false)
      setMemberToRemove(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setIsUpdatingRole(false)
    }
  }

  const handleRemoveMemberClick = (member: WorkspaceMember) => {
    setMemberToRemove(member)
    setRemoveMemberDialogOpen(true)
  }

  const handleLeaveWorkspace = async () => {
    if (!accessToken) return

    try {
      setIsLeavingWorkspace(true)
      setError(null)
      await leaveWorkspace(accessToken, workspaceId)
      // Redirect to workspaces page after leaving
      window.location.href = '/workspaces'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave workspace')
    } finally {
      setIsLeavingWorkspace(false)
    }
  }

  useEffect(() => {
    if (!user || !accessToken || !workspaceId) return
    refreshWorkspaceData()
  }, [user, accessToken, workspaceId, refreshWorkspaceData])

  // Refresh workspace data when the page becomes visible (e.g., after creating a workspace)
  useEffect(() => {
    const handleFocus = () => {
      if (user && accessToken && workspaceId) {
        refreshWorkspaceData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, accessToken, workspaceId])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!user) return <div className="p-6">Not authenticated</div>
  if (!workspaceMembership) return <div className="p-6">Loading workspace...</div>

  return (
    <div className="p-6">
      <WorkspaceHeader
        workspaceMembership={workspaceMembership}
        onEditClick={() => setEditDialogOpen(true)}
        onInviteClick={() => setInviteDialogOpen(true)}
        onLeaveClick={() => setLeaveDialogOpen(true)}
        isLeaving={isLeavingWorkspace}
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <WorkspaceInfoCard
          workspaceMembership={workspaceMembership}
          onLeaveClick={() => setLeaveDialogOpen(true)}
          isLeaving={isLeavingWorkspace}
        />
        <WorkspaceStatsCard workspaceMembers={workspaceMembers} />
      </div>

      <WorkspaceMembersTable
        workspaceMembers={workspaceMembers}
        workspaceMembership={workspaceMembership}
        isLoadingMembers={isLoadingMembers}
        editingMemberId={editingMemberId}
        isUpdatingRole={isUpdatingRole}
        onEditRole={setEditingMemberId}
        onUpdateRole={handleUpdateRole}
        onRemoveMember={handleRemoveMemberClick}
      />

      {/* Workspace Edit Modal */}
      <WorkspaceEditDialog
        workspace={
          workspaceMembership
            ? {
                id: workspaceMembership.workspace.id,
                name: workspaceMembership.workspace.name
              }
            : null
        }
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={refreshWorkspaceData}
      />

      {/* Workspace Invite Modal */}
      <WorkspaceInviteDialog
        workspaceId={workspaceId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={refreshWorkspaceData}
      />

      {/* Leave Workspace Dialog */}
      <LeaveWorkspaceDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirm={handleLeaveWorkspace}
        workspaceName={workspaceMembership?.workspace.name || ''}
        isLeaving={isLeavingWorkspace}
      />

      {/* Remove Member Dialog */}
      <RemoveMemberDialog
        open={removeMemberDialogOpen}
        onOpenChange={setRemoveMemberDialogOpen}
        onConfirm={() => handleRemoveMember(memberToRemove?.userId || '')}
        memberName={memberToRemove?.user.username || ''}
        workspaceName={workspaceMembership?.workspace.name || ''}
        isRemoving={isUpdatingRole}
      />
    </div>
  )
}
