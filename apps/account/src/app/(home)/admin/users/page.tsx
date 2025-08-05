import { AdminUsersProvider } from '@/features/admin/providers/admin-users-provider'
import { AdminUsersContent } from '@/features/admin/components/admin-users-client'

export default function UsersPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions across all workspaces
        </p>
      </div>

      <AdminUsersProvider>
        <AdminUsersContent />
      </AdminUsersProvider>
    </div>
  )
}
