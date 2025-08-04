import { InvitationsClient } from '@/components/invitations/invitations-client'

export default function InvitationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-muted-foreground">
          Manage your workspace invitations and pending requests
        </p>
      </div>

      <InvitationsClient />
    </div>
  )
}
