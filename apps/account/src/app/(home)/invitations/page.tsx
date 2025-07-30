'use client'

import { useState } from 'react'
import { useUser, useInvites } from '@repo/auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import { Button } from '@repo/ui/components/base/button'
import { Badge } from '@repo/ui/components/base/badge'
import { Separator } from '@repo/ui/components/base/separator'
import { acceptWorkspaceInvite, declineWorkspaceInvite } from '@repo/api'
import { Mail, Check, X, Clock, Building2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { WorkspaceInvite } from '@repo/types'

export default function InvitationsPage() {
  const { user, accessToken } = useUser()
  const { invites, loading, error, refreshInvites } = useInvites()
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  const handleAcceptInvite = async (inviteId: string) => {
    if (!accessToken) return
    try {
      setProcessingInviteId(inviteId)
      setActionError(null)

      const result = await acceptWorkspaceInvite(accessToken, inviteId)

      // Refresh the invites list
      await refreshInvites()

      // Navigate to the workspace
      router.push(`/workspaces/${result.userWorkspace.workspace.id}`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setProcessingInviteId(null)
    }
  }

  const handleDeclineInvite = async (inviteId: string) => {
    if (!accessToken) return
    try {
      setProcessingInviteId(inviteId)
      setActionError(null)

      await declineWorkspaceInvite(accessToken, inviteId)

      // Refresh the invites list
      await refreshInvites()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to decline invitation')
    } finally {
      setProcessingInviteId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'accepted':
        return <Check className="h-4 w-4 text-green-600" />
      case 'declined':
        return <X className="h-4 w-4 text-red-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default' as const
      case 'accepted':
        return 'secondary' as const
      case 'declined':
        return 'destructive' as const
      default:
        return 'outline' as const
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default' as const
      case 'admin':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Not authenticated</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-8">Loading invitations...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Workspace Invitations
        </h1>
        <p className="text-muted-foreground">Manage your workspace invitations and join requests</p>
      </div>

      {(error || actionError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error || actionError}</p>
        </div>
      )}

      {invites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invitations</h3>
            <p className="text-muted-foreground">
              You don't have any pending workspace invitations at the moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle className="text-lg">
                        {invite.workspace?.name || 'Unknown Workspace'}
                      </CardTitle>
                      <CardDescription>
                        Invited by{' '}
                        {invite.invitedBy?.fullName || invite.invitedBy?.username || 'Unknown User'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invite.status)}
                    <Badge variant={getStatusBadgeVariant(invite.status)}>
                      {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  {invite.status === 'pending' && (
                    <div>
                      <Separator className="my-3" />
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {isExpired(invite.expiresAt) ? (
                            <span className="text-red-600">This invitation has expired</span>
                          ) : (
                            <span>You can accept or decline this invitation</span>
                          )}
                        </div>
                        {!isExpired(invite.expiresAt) && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeclineInvite(invite.id)}
                              disabled={processingInviteId === invite.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptInvite(invite.id)}
                              disabled={processingInviteId === invite.id}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
