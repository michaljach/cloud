import type { WorkspaceInvite } from '@repo/types'
import { prisma } from '@lib/prisma'

/**
 * Create a workspace invitation
 * @param workspaceId Workspace ID
 * @param invitedByUserId User ID who is sending the invitation
 * @param invitedUsername Username of the person being invited
 * @param role Role to assign when accepted (default: 'member')
 * @returns Created invitation
 */
export async function createWorkspaceInvite(
  workspaceId: string,
  invitedByUserId: string,
  invitedUsername: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<WorkspaceInvite> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: invitedUsername }
  })

  // Check if there's already an invitation for this workspace and username
  const existingInvite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      invitedUsername,
      status: 'pending' // Only check pending invitations since others are deleted
    }
  })

  if (existingInvite) {
    throw new Error('User already has a pending invitation to this workspace')
  }

  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId,
      invitedByUserId,
      invitedUserId: existingUser?.id || null,
      invitedUsername,
      role
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true
        }
      },
      invitedBy: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      },
      invitedUser: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    }
  })

  // Cast the role to the expected union type and convert dates to strings
  return {
    ...invite,
    role: invite.role as 'owner' | 'admin' | 'member',
    status: invite.status as 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled',
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString()
  }
}

/**
 * Get all pending invitations for a user
 * @param userId User ID
 * @returns Array of pending invitations
 */
export async function getUserInvites(userId: string): Promise<WorkspaceInvite[]> {
  const invites = await prisma.workspaceInvite.findMany({
    where: {
      OR: [
        { invitedUserId: userId },
        {
          invitedUsername: {
            equals: (await prisma.user.findUnique({ where: { id: userId } }))?.username
          }
        }
      ],
      status: 'pending',
      expiresAt: { gt: new Date() }
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true
        }
      },
      invitedBy: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return invites.map((invite) => ({
    ...invite,
    role: invite.role as 'owner' | 'admin' | 'member',
    status: invite.status as 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled',
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString()
  }))
}

/**
 * Get all invitations for a workspace
 * @param workspaceId Workspace ID
 * @returns Array of workspace invitations
 */
export async function getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
  const invites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      status: 'pending' // Only return pending invitations since others are deleted
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      },
      invitedUser: {
        select: {
          id: true,
          username: true,
          fullName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return invites.map((invite) => ({
    ...invite,
    role: invite.role as 'owner' | 'admin' | 'member',
    status: invite.status as 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled',
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString()
  }))
}

/**
 * Accept a workspace invitation
 * @param inviteId Invitation ID
 * @param userId User ID accepting the invitation
 * @returns Updated invitation and user workspace relationship
 */
export async function acceptWorkspaceInvite(
  inviteId: string,
  userId: string
): Promise<{ invite: WorkspaceInvite; userWorkspace: any }> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
    include: { workspace: true }
  })

  if (!invite) {
    throw new Error('Invitation not found')
  }

  if (invite.status !== 'pending') {
    throw new Error('Invitation is no longer pending')
  }

  if (invite.expiresAt < new Date()) {
    throw new Error('Invitation has expired')
  }

  // Verify the user matches the invitation
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (
    !user ||
    (invite.invitedUserId && invite.invitedUserId !== userId) ||
    (!invite.invitedUserId && invite.invitedUsername !== user.username)
  ) {
    throw new Error('You are not authorized to accept this invitation')
  }

  // Check if user is already a member
  const existingMembership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: invite.workspaceId
      }
    }
  })

  if (existingMembership) {
    throw new Error('You are already a member of this workspace')
  }

  // Use transaction to update invite and create membership
  const result = await prisma.$transaction(async (tx: any) => {
    // Create user workspace membership
    const userWorkspace = await tx.userWorkspace.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Delete the invitation after successful acceptance
    await tx.workspaceInvite.delete({
      where: { id: inviteId }
    })

    return {
      invite: {
        ...invite,
        role: invite.role as 'owner' | 'admin' | 'member',
        status: 'accepted' as const,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString()
      },
      userWorkspace
    }
  })

  return result
}

/**
 * Decline a workspace invitation
 * @param inviteId Invitation ID
 * @param userId User ID declining the invitation
 * @returns Updated invitation
 */
export async function declineWorkspaceInvite(
  inviteId: string,
  userId: string
): Promise<WorkspaceInvite> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId }
  })

  if (!invite) {
    throw new Error('Invitation not found')
  }

  if (invite.status !== 'pending') {
    throw new Error('Invitation is no longer pending')
  }

  // Verify the user matches the invitation
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (
    !user ||
    (invite.invitedUserId && invite.invitedUserId !== userId) ||
    (!invite.invitedUserId && invite.invitedUsername !== user.username)
  ) {
    throw new Error('You are not authorized to decline this invitation')
  }

  // Delete the invitation
  await prisma.workspaceInvite.delete({
    where: { id: inviteId }
  })

  // Return a mock invitation object for consistency
  return {
    ...invite,
    role: invite.role as 'owner' | 'admin' | 'member',
    status: 'declined' as const,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString()
  }
}

/**
 * Cancel a workspace invitation (by the inviter)
 * @param inviteId Invitation ID
 * @param userId User ID who sent the invitation
 * @returns Updated invitation
 */
export async function cancelWorkspaceInvite(
  inviteId: string,
  userId: string
): Promise<WorkspaceInvite> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId }
  })

  if (!invite) {
    throw new Error('Invitation not found')
  }

  if (invite.invitedByUserId !== userId) {
    throw new Error('You can only cancel invitations you sent')
  }

  if (invite.status !== 'pending') {
    throw new Error('Can only cancel pending invitations')
  }

  // Delete the invitation
  await prisma.workspaceInvite.delete({
    where: { id: inviteId }
  })

  // Return a mock invitation object for consistency
  return {
    ...invite,
    role: invite.role as 'owner' | 'admin' | 'member',
    status: 'cancelled' as const,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString()
  }
}
