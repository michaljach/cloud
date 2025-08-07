export default function AdminConsolePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <p className="text-muted-foreground">Manage users, workspaces, and system settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Users</h2>
          <p className="text-muted-foreground mb-4">Manage user accounts and permissions</p>
          <a href="/admin/users" className="text-primary hover:underline">
            Manage Users →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Workspaces</h2>
          <p className="text-muted-foreground mb-4">Manage workspace settings and memberships</p>
          <a href="/admin/workspaces" className="text-primary hover:underline">
            Manage Workspaces →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Platform Settings</h2>
          <p className="text-muted-foreground mb-4">
            Configure global platform settings and preferences
          </p>
          <a href="/admin/settings" className="text-primary hover:underline">
            Platform Settings →
          </a>
        </div>
      </div>
    </div>
  )
}
