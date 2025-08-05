import { WorkspacesClient } from '@/components/cards/workspaces-client'

export default function WorkspacesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground">
          Manage your workspaces and collaborate with your team
        </p>
      </div>

      <WorkspacesClient />
    </div>
  )
}
