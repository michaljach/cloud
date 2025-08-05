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
import { Users, Crown, Shield, User } from 'lucide-react'
import type { WorkspaceMembership, WorkspaceMember } from '@repo/types'

interface WorkspaceMembersTableProps {
  workspaceMembers: WorkspaceMember[]
  workspaceMembership: WorkspaceMembership
  isLoadingMembers: boolean
  editingMemberId: string | null
  isUpdatingRole: boolean
  onEditRole: (memberId: string | null) => void
  onUpdateRole: (userId: string, newRole: 'owner' | 'admin' | 'member') => void
  onRemoveMember: (member: WorkspaceMember) => void
}

export function WorkspaceMembersTable({
  workspaceMembers,
  workspaceMembership,
  isLoadingMembers,
  editingMemberId,
  isUpdatingRole,
  onEditRole,
  onUpdateRole,
  onRemoveMember
}: WorkspaceMembersTableProps) {
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
                    <div className="text-sm">{new Date(member.joinedAt).toLocaleDateString()}</div>
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
                                  return
                                }
                                onUpdateRole(member.userId, value)
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
                              onClick={() => onEditRole(null)}
                              disabled={isUpdatingRole}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditRole(member.userId)}
                            disabled={isUpdatingRole}
                          >
                            Edit Role
                          </Button>
                        )}
                        {member.role !== 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveMember(member)}
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
  )
}
