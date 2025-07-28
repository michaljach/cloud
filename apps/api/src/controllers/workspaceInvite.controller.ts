import { Controller, Get, Post, Put, Delete, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import { authenticate } from '../middleware/authenticate'
import { validate } from '../middleware/validate'
import { CurrentUser } from '../decorators/currentUser'
import { z } from 'zod'
import type { User } from '@repo/types'
import { getUserById } from '../services/users.service'
import { getWorkspaceWithMembers } from '../services/workspace.service'
import { isRootAdmin } from '../utils'
import {
  createWorkspaceInvite,
  getUserInvites,
  getWorkspaceInvites,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  cancelWorkspaceInvite
} from '../services/workspaceInvite.service'

@Controller('/workspace-invites')
export default class WorkspaceInviteController {
  /**
   * GET /api/workspace-invites/my
   * Get current user's pending invitations
   */
  @Get('/my')
  @UseBefore(authenticate)
  async getMyInvites(@CurrentUser() oauthUser: User, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const invites = await getUserInvites(user.id)
      return res.json({ success: true, data: invites, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * GET /api/workspace-invites/workspace/:workspaceId
   * Get all invitations for a workspace (workspace admin/owner only)
   */
  @Get('/workspace/:workspaceId')
  @UseBefore(authenticate)
  async getWorkspaceInvites(
    @CurrentUser() oauthUser: User,
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const workspace = await getWorkspaceWithMembers(workspaceId)
      if (!workspace) {
        return res.status(404).json({ success: false, data: null, error: 'Workspace not found' })
      }

      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return res
            .status(403)
            .json({ success: false, data: null, error: 'Insufficient permissions' })
        }
      }

      const invites = await getWorkspaceInvites(workspaceId)
      return res.json({ success: true, data: invites, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * POST /api/workspace-invites
   * Create a workspace invitation (workspace admin/owner only)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(
    validate(
      z.object({
        workspaceId: z.string().min(1, 'Workspace ID is required'),
        invitedUsername: z.string().min(1, 'Username is required'),
        role: z.enum(['owner', 'admin', 'member']).default('member')
      })
    )
  )
  async createInvite(@CurrentUser() oauthUser: User, @Req() req: Request, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const { workspaceId, invitedUsername, role } = req.body

      const workspace = await getWorkspaceWithMembers(workspaceId)
      if (!workspace) {
        return res.status(404).json({ success: false, data: null, error: 'Workspace not found' })
      }

      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return res
            .status(403)
            .json({ success: false, data: null, error: 'Insufficient permissions' })
        }
      }

      // Check if user is already a member
      const existingMember = workspace.userWorkspaces?.find(
        (uw) => uw.user.username === invitedUsername
      )
      if (existingMember) {
        return res
          .status(400)
          .json({ success: false, data: null, error: 'User is already a member of this workspace' })
      }

      const invite = await createWorkspaceInvite(workspaceId, user.id, invitedUsername, role)
      return res.status(201).json({ success: true, data: invite, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * PUT /api/workspace-invites/:inviteId/accept
   * Accept a workspace invitation
   */
  @Put('/:inviteId/accept')
  @UseBefore(authenticate)
  async acceptInvite(
    @CurrentUser() oauthUser: User,
    @Param('inviteId') inviteId: string,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const result = await acceptWorkspaceInvite(inviteId, user.id)
      return res.json({ success: true, data: result, error: null })
    } catch (err: any) {
      return res.status(400).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * PUT /api/workspace-invites/:inviteId/decline
   * Decline a workspace invitation
   */
  @Put('/:inviteId/decline')
  @UseBefore(authenticate)
  async declineInvite(
    @CurrentUser() oauthUser: User,
    @Param('inviteId') inviteId: string,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const invite = await declineWorkspaceInvite(inviteId, user.id)
      return res.json({ success: true, data: invite, error: null })
    } catch (err: any) {
      return res.status(400).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * DELETE /api/workspace-invites/:inviteId
   * Cancel a workspace invitation (by the inviter)
   */
  @Delete('/:inviteId')
  @UseBefore(authenticate)
  async cancelInvite(
    @CurrentUser() oauthUser: User,
    @Param('inviteId') inviteId: string,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const invite = await cancelWorkspaceInvite(inviteId, user.id)
      return res.json({ success: true, data: invite, error: null })
    } catch (err: any) {
      return res.status(400).json({ success: false, data: null, error: err.message })
    }
  }
}
