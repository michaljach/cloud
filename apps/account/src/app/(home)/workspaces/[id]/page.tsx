'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@repo/auth'
import {
  getMyWorkspaces,
  getWorkspaceMembers,
  updateUserWorkspaceRole,
  removeUserFromWorkspace
} from '@repo/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import { Badge } from '@repo/ui/components/base/badge'
import { Button } from '@repo/ui/components/base/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@repo/ui/components/base/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@repo/ui/components/base/select'
import { Building2, Users, Calendar, ArrowLeft, Shield, Crown, User, Edit } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { WorkspaceEditModal } from '../../../../components/workspace-edit-modal'

interface WorkspaceMembership {
  id: string
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  workspace: {
    id: string
    name: string
  }
}

interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  user: {
    id: string
    username: string
    fullName?: string
  }
  workspace: {
    id: string
    name: string
  }
}

export default function WorkspaceDetailsPage() {
  const { user, loading, accessToken } = useUser()
  const params = useParams()
  const workspaceId = params.id as string

  const [workspaceMembership, setWorkspaceMembership] = useState<WorkspaceMembership | null>(null)
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  const refreshWorkspaceData = async () => {
    if (!accessToken) return

    try {
      // Get user's workspace memberships
      const userWorkspaces = await getMyWorkspaces(accessToken)
      const membership = userWorkspaces.find((uw) => uw.workspaceId === workspaceId)

      if (!membership) {
        setError('You are not a member of this workspace')
        return
      }

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
  }

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
    if (!accessToken || !workspaceId) return

    setError(null) // Clear any previous errors
    try {
      await removeUserFromWorkspace(accessToken, workspaceId, userId)
      await refreshWorkspaceData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  useEffect(() => {
    if (!user || !accessToken || !workspaceId) return
    refreshWorkspaceData()
  }, [user, accessToken, workspaceId])

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const
      case 'admin':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  // Helper function to check if changing a role would remove the last owner
  const wouldRemoveLastOwner = (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    const currentOwners = workspaceMembers.filter((m) => m.role === 'owner')
    const targetMember = workspaceMembers.find((m) => m.userId === memberId)

    if (!targetMember) return false

    // If the member is currently an owner and we're changing them to non-owner
    if (targetMember.role === 'owner' && newRole !== 'owner') {
      // Check if they're the only owner
      return currentOwners.length === 1
    }

    return false
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{workspaceMembership.workspace.name}</h1>
          <Badge variant={getRoleBadgeVariant(workspaceMembership.role)}>
            {getRoleIcon(workspaceMembership.role)}
            <span className="ml-1">{workspaceMembership.role}</span>
          </Badge>
          {(workspaceMembership.role === 'owner' || workspaceMembership.role === 'admin') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="ml-2"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        <p className="text-muted-foreground">Workspace ID: {workspaceMembership.workspace.id}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Workspace Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Workspace Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-lg">{workspaceMembership.workspace.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Your Role</label>
              <div className="flex items-center gap-2 mt-1">
                {getRoleIcon(workspaceMembership.role)}
                <Badge variant={getRoleBadgeVariant(workspaceMembership.role)}>
                  {workspaceMembership.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Member Since</label>
              <p className="text-sm">
                {new Date(workspaceMembership.joinedAt).toLocaleDateString()} at{' '}
                {new Date(workspaceMembership.joinedAt).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Total Members</label>
              <p className="text-lg font-semibold">{workspaceMembers.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {workspaceMembers.filter((m) => m.role === 'owner').length}
                </div>
                <div className="text-sm text-muted-foreground">Owners</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {workspaceMembers.filter((m) => m.role === 'admin').length}
                </div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {workspaceMembers.filter((m) => m.role === 'member').length}
              </div>
              <div className="text-sm text-muted-foreground">Members</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workspace Members
          </CardTitle>
          <CardDescription>All members of this workspace and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingMembers ? (
            <div className="text-center py-8">Loading members...</div>
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
                        <div className="text-sm text-muted-foreground">@{member.user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {workspaceMembership.role === 'owner' ||
                      (workspaceMembership.role === 'admin' && member.role === 'member') ? (
                        <div className="flex gap-2">
                          {editingMemberId === member.userId ? (
                            <div className="flex gap-2">
                              <Select
                                defaultValue={member.role}
                                onValueChange={(value: 'owner' | 'admin' | 'member') => {
                                  // Prevent removing the last owner
                                  if (wouldRemoveLastOwner(member.userId, value)) {
                                    setError(
                                      'Cannot remove the last owner. There must always be at least one owner.'
                                    )
                                    return
                                  }
                                  handleUpdateRole(member.userId, value)
                                }}
                                disabled={isUpdatingRole}
                              >
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="owner">Owner</SelectItem>
                                  <SelectItem
                                    value="admin"
                                    disabled={wouldRemoveLastOwner(member.userId, 'admin')}
                                  >
                                    Admin
                                  </SelectItem>
                                  <SelectItem
                                    value="member"
                                    disabled={wouldRemoveLastOwner(member.userId, 'member')}
                                  >
                                    Member
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingMemberId(null)}
                                disabled={isUpdatingRole}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMemberId(member.userId)}
                              disabled={isUpdatingRole}
                            >
                              Edit Role
                            </Button>
                          )}
                          {member.role !== 'owner' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              disabled={isUpdatingRole}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No actions</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Workspace Edit Modal */}
      <WorkspaceEditModal
        workspace={
          workspaceMembership
            ? {
                id: workspaceMembership.workspace.id,
                name: workspaceMembership.workspace.name
              }
            : null
        }
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={refreshWorkspaceData}
      />
    </div>
  )
}
