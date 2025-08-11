import { Button } from '@repo/ui/components/base/button'
import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form'

export default function CreateWorkspacePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/workspaces">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workspaces
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Create Workspace</h1>
        </div>

        <p className="text-muted-foreground">
          Create a new workspace to organize your team and resources.
        </p>
      </div>

      <div className="max-w-2xl">
        <CreateWorkspaceForm />
      </div>
    </div>
  )
}
