import { AdminWorkspacesProvider } from '@/features/admin/providers/admin-workspaces-provider'
import { AdminWorkspacesContent } from '@/features/admin/components/admin-workspaces-client'

export default function WorkspacesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Workspace Management</h1>
        <p className="text-muted-foreground">
          Manage workspaces, memberships, and workspace settings
        </p>
      </div>

      <AdminWorkspacesProvider>
        <AdminWorkspacesContent />
      </AdminWorkspacesProvider>
    </div>
  )
}
