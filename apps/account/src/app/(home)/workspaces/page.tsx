'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@repo/auth'
import { getMyWorkspaces } from '@repo/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import { Badge } from '@repo/ui/components/base/badge'
import { Button } from '@repo/ui/components/base/button'
import { Building2, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface WorkspaceMembership {
  id: string
  userId: string
  workspaceId: string
  role: string
  joinedAt: string
  workspace: {
    id: string
    name: string
  }
}

export default function WorkspacesPage() {
  const { user, loading, accessToken } = useUser()
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([])
  const [error, setError] = useState<string | null>(null)

  const refreshWorkspaces = async () => {
    if (!accessToken) return
    try {
      const fetchedWorkspaces = await getMyWorkspaces(accessToken)
      setWorkspaces(fetchedWorkspaces)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workspaces')
    }
  }

  useEffect(() => {
    if (!user || !accessToken) return
    refreshWorkspaces()
  }, [user, accessToken])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!user) return <div className="p-6">Not authenticated</div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Workspaces</h1>
        <p className="text-muted-foreground">Manage your workspace memberships and access</p>
      </div>

      {workspaces.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workspaces</h3>
            <p className="text-muted-foreground mb-4">
              You are not a member of any workspaces yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact an administrator to be added to a workspace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((membership) => (
            <Card key={membership.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{membership.workspace.name}</CardTitle>
                  <Badge
                    variant={
                      membership.role === 'owner'
                        ? 'default'
                        : membership.role === 'admin'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {membership.role}
                  </Badge>
                </div>
                <CardDescription>Workspace ID: {membership.workspace.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    Member since {new Date(membership.joinedAt).toLocaleDateString()}
                  </div>
                  <Button asChild className="w-full mt-4">
                    <Link href={`/workspaces/${membership.workspace.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
