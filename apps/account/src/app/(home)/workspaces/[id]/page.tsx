import { WorkspaceDetailsClient } from '@/components/workspaces/workspace-details-client'

export default function WorkspaceDetailsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspace Details</h1>
        <p className="text-muted-foreground">
          View and manage workspace settings, members, and permissions
        </p>
      </div>

      <WorkspaceDetailsClient />
    </div>
  )
}
