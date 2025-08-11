import { Badge } from '@repo/ui/components/base/badge'
import { Button } from '@repo/ui/components/base/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card'
import { Building2 } from 'lucide-react'

import type { WorkspaceMembership } from '@repo/types'

interface WorkspaceInfoCardProps {
  workspaceMembership: WorkspaceMembership
  onLeaveClick: () => void
  isLeaving: boolean
}

export function WorkspaceInfoCard({
  workspaceMembership,
  onLeaveClick,
  isLeaving
}: WorkspaceInfoCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <span className="text-yellow-600">👑</span>
      case 'admin':
        return <span className="text-blue-600">🛡️</span>
      default:
        return <span className="text-gray-600">👤</span>
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

  return (
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
        <div className="pt-4 border-t">
          <label className="text-sm font-medium text-muted-foreground">Actions</label>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onLeaveClick}
              disabled={isLeaving}
              className="w-full"
            >
              {isLeaving ? 'Leaving...' : 'Leave Workspace'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
