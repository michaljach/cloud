import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card'
import type { WorkspaceMember } from '@repo/types'

interface WorkspaceStatsCardProps {
  workspaceMembers: WorkspaceMember[]
}

export function WorkspaceStatsCard({ workspaceMembers }: WorkspaceStatsCardProps) {
  return (
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
  )
}
