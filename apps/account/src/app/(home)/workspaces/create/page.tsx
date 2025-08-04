import { WorkspaceCreateClient } from '@/components/workspaces/workspace-create-client'

export default function CreateWorkspacePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Workspace</h1>
        <p className="text-muted-foreground">
          Create a new workspace to collaborate with your team
        </p>
      </div>

      <WorkspaceCreateClient />
    </div>
  )
}
