export default function Home() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome to Cloud Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your workspaces, account settings, and collaborate with your team
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Workspaces</h2>
          <p className="text-muted-foreground mb-4">
            Manage your workspaces and collaborate with your team
          </p>
          <a href="/workspaces" className="text-primary hover:underline">
            View Workspaces →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Account Settings</h2>
          <p className="text-muted-foreground mb-4">
            Update your profile information and preferences
          </p>
          <a href="/account" className="text-primary hover:underline">
            Manage Account →
          </a>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Invitations</h2>
          <p className="text-muted-foreground mb-4">View and respond to workspace invitations</p>
          <a href="/invitations" className="text-primary hover:underline">
            View Invitations →
          </a>
        </div>
      </div>
    </div>
  )
}
