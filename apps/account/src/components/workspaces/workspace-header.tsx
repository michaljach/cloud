import Link from 'next/link'
import { ArrowLeft, Edit, UserPlus } from 'lucide-react'
import { Button } from '@repo/ui/components/base/button'
import type { WorkspaceMembership } from '@repo/types'

interface WorkspaceHeaderProps {
  workspaceMembership: WorkspaceMembership
  onEditClick: () => void
  onInviteClick: () => void
  onLeaveClick: () => void
  isLeaving: boolean
}

export function WorkspaceHeader({
  workspaceMembership,
  onEditClick,
  onInviteClick,
  onLeaveClick,
  isLeaving
}: WorkspaceHeaderProps) {
  return (
    <>
      {/* Navigation */}
      <div className="mb-4">
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspaces
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {workspaceMembership?.workspace.name}
              {workspaceMembership?.role === 'owner' || workspaceMembership?.role === 'admin' ? (
                <Button variant="ghost" size="sm" className="ml-2" onClick={onEditClick}>
                  <Edit className="h-4 w-4" />
                </Button>
              ) : null}
            </h1>
            <p className="text-muted-foreground">
              Workspace ID: {workspaceMembership?.workspace.id}
            </p>
          </div>
          <div className="flex gap-2">
            {(workspaceMembership?.role === 'owner' || workspaceMembership?.role === 'admin') && (
              <Button onClick={onInviteClick}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            )}
            <Button variant="outline" onClick={onLeaveClick} disabled={isLeaving}>
              {isLeaving ? 'Leaving...' : 'Leave Workspace'}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
