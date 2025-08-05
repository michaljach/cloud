import { Mail } from 'lucide-react'
import { InvitationsTable } from '@/features/admin/tables/invitations-table'

export default function InvitationsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Workspace Invitations
        </h1>
        <p className="text-muted-foreground">Manage your workspace invitations and join requests</p>
      </div>

      <InvitationsTable />
    </div>
  )
}
