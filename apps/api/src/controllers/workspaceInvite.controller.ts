import { Controller, Get, Post, Put, Delete, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import { authenticate } from '../middleware/authenticate'
import { validate } from '../middleware/validate'
import { CurrentUser } from '../decorators/currentUser'
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
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendForbiddenResponse,
  sendServerErrorResponse,
  validationSchemas
} from '../utils'

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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const invites = await getUserInvites(user.id)
      return sendSuccessResponse(res, invites)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const workspace = await getWorkspaceWithMembers(workspaceId)
      if (!workspace) {
        return sendNotFoundResponse(res, 'Workspace not found')
      }

      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return sendForbiddenResponse(res, 'Insufficient permissions')
        }
      }

      const invites = await getWorkspaceInvites(workspaceId)
      return sendSuccessResponse(res, invites)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * POST /api/workspace-invites
   * Create a workspace invitation (workspace admin/owner only)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(validate(validationSchemas.createWorkspaceInvite))
  async createInvite(@CurrentUser() oauthUser: User, @Req() req: Request, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    try {
      const { workspaceId, invitedUsername, role } = req.body

      const workspace = await getWorkspaceWithMembers(workspaceId)
      if (!workspace) {
        return sendNotFoundResponse(res, 'Workspace not found')
      }

      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return sendForbiddenResponse(res, 'Insufficient permissions')
        }
      }

      // Check if user is already a member
      const existingMember = workspace.userWorkspaces?.find(
        (uw) => uw.user.username === invitedUsername
      )
      if (existingMember) {
        return sendErrorResponse(res, 'User is already a member of this workspace', 400)
      }

      const invite = await createWorkspaceInvite(workspaceId, user.id, invitedUsername, role)
      return sendSuccessResponse(res, invite, 201)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const result = await acceptWorkspaceInvite(inviteId, user.id)
      return sendSuccessResponse(res, result)
    } catch (err: any) {
      return sendErrorResponse(res, err.message, 400)
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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const invite = await declineWorkspaceInvite(inviteId, user.id)
      return sendSuccessResponse(res, invite)
    } catch (err: any) {
      return sendErrorResponse(res, err.message, 400)
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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const invite = await cancelWorkspaceInvite(inviteId, user.id)
      return sendSuccessResponse(res, invite)
    } catch (err: any) {
      return sendErrorResponse(res, err.message, 400)
    }
  }
}
