'use client'

import { useState } from 'react'
import { useUser, useInvites } from '@repo/providers'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/base/table'
import { Button } from '@repo/ui/components/base/button'
import { Badge } from '@repo/ui/components/base/badge'
import { acceptWorkspaceInvite, declineWorkspaceInvite } from '@repo/api'
import { Mail, Check, X, Clock, Building2, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { WorkspaceInvite } from '@repo/types'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600', badge: 'default' as const },
  accepted: { icon: Check, color: 'text-green-600', badge: 'secondary' as const },
  declined: { icon: X, color: 'text-red-600', badge: 'destructive' as const }
} as const

const ROLE_CONFIG = {
  owner: 'default' as const,
  admin: 'secondary' as const,
  member: 'outline' as const
} as const

export function InvitationsTable() {
  const { user, accessToken } = useUser()
  const { invites, loading, error, refreshInvites } = useInvites()
  const [processingInviteId, setProcessingInviteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const router = useRouter()

  const handleInviteAction = async (action: 'accept' | 'decline', inviteId: string) => {
    if (!accessToken) return

    try {
      setProcessingInviteId(inviteId)
      setActionError(null)

      if (action === 'accept') {
        const result = await acceptWorkspaceInvite(accessToken, inviteId)
        await refreshInvites()
        router.push(`/workspaces/${result.userWorkspace.workspace.id}`)
      } else {
        await declineWorkspaceInvite(accessToken, inviteId)
        await refreshInvites()
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${action} invitation`)
    } finally {
      setProcessingInviteId(null)
    }
  }

  const getStatusDisplay = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
    const IconComponent = config.icon
    return {
      icon: <IconComponent className={`h-4 w-4 ${config.color}`} />,
      badge: config.badge,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading invitations...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Not authenticated</p>
      </div>
    )
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No invitations</h3>
        <p className="text-muted-foreground">
          You don't have any pending workspace invitations at the moment.
        </p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{actionError}</p>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Workspace</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => {
            const statusDisplay = getStatusDisplay(invite.status)
            const isProcessing = processingInviteId === invite.id
            const expired = isExpired(invite.expiresAt)

            return (
              <TableRow key={invite.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {invite.workspace?.name || 'Unknown Workspace'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {invite.invitedBy?.fullName || invite.invitedBy?.username || 'Unknown User'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={ROLE_CONFIG[invite.role as keyof typeof ROLE_CONFIG] || 'outline'}
                  >
                    {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusDisplay.icon}
                    <Badge variant={statusDisplay.badge}>{statusDisplay.label}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={expired ? 'text-red-600' : 'text-muted-foreground'}>
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  {invite.status === 'pending' && !expired && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInviteAction('decline', invite.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleInviteAction('accept', invite.id)}
                        disabled={isProcessing}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                  {invite.status === 'pending' && expired && (
                    <span className="text-sm text-red-600">Expired</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}
