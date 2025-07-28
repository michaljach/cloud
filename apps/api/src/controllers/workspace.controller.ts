import 'reflect-metadata'
import {
  JsonController,
  Get,
  Post,
  Delete,
  Put,
  Res,
  UseBefore,
  Body,
  Req,
  Param
} from 'routing-controllers'
import type { Response, Request } from 'express'
import { authenticate } from '@middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import {
  listWorkspaces,
  createWorkspace,
  getWorkspaceWithMembers,
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateUserWorkspaceRole,
  getUserWorkspaces,
  updateWorkspace
} from '@services/workspace.service'
import { getUserById } from '@services/users.service'
import { isRootAdmin } from '../utils'
import { z } from 'zod'
import { validate } from '@middleware/validate'

@JsonController('/workspaces')
export default class WorkspaceController {
  /**
   * GET /api/workspaces
   * List all workspaces (root_admin only)
   */
  @Get('/')
  @UseBefore(authenticate)
  async list(@CurrentUser() oauthUser: User, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    if (!isRootAdmin(user)) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    try {
      const workspaces = await listWorkspaces()
      return res.json({ success: true, data: workspaces, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * GET /api/workspaces/my
   * Get current user's workspaces
   */
  @Get('/my')
  @UseBefore(authenticate)
  async getMyWorkspaces(@CurrentUser() oauthUser: User, @Res() res: Response) {
    try {
      const workspaces = await getUserWorkspaces(oauthUser.id)
      return res.json({ success: true, data: workspaces, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * GET /api/workspaces/:id/members
   * Get workspace members (workspace admin/owner only)
   */
  @Get('/:id/members')
  @UseBefore(authenticate)
  async getMembers(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
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
        if (!userMembership) {
          return res
            .status(403)
            .json({ success: false, data: null, error: 'Not a member of this workspace' })
        }
      }

      return res.json({ success: true, data: workspace.userWorkspaces, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * PUT /api/workspaces/:id
   * Update workspace properties (admin/root_admin only)
   */
  @Put('/:id')
  @UseBefore(authenticate)
  @UseBefore(validate(z.object({ name: z.string().min(1, 'Workspace name is required') })))
  async update(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Req() req: Request,
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

      // Check permissions: root admin can edit any workspace, admin can only edit workspaces they're admin/owner of
      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return res
            .status(403)
            .json({ success: false, data: null, error: 'Insufficient permissions' })
        }
      }

      const { name } = req.body
      const updatedWorkspace = await updateWorkspace(workspaceId, name)
      return res.json({ success: true, data: updatedWorkspace, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * POST /api/workspaces
   * Create a new workspace (any authenticated user)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(validate(z.object({ name: z.string().min(1, 'Workspace name is required') })))
  async create(@CurrentUser() oauthUser: User, @Req() req: Request, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    const { name } = req.body

    try {
      const workspace = await createWorkspace(name)

      // Add the creator as the owner of the workspace
      await addUserToWorkspace(user.id, workspace.id, 'owner')

      return res.status(201).json({ success: true, data: workspace, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * POST /api/workspaces/:id/members
   * Add a user to a workspace (workspace admin/owner only)
   */
  @Post('/:id/members')
  @UseBefore(authenticate)
  @UseBefore(
    validate(
      z.object({
        userId: z.string().min(1, 'User ID is required'),
        role: z.enum(['owner', 'admin', 'member']).default('member')
      })
    )
  )
  async addMember(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Req() req: Request,
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

      const { userId, role } = req.body
      const userWorkspace = await addUserToWorkspace(userId, workspaceId, role)
      return res.status(201).json({ success: true, data: userWorkspace, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * PUT /api/workspaces/:id/members/:userId
   * Update user role in workspace (workspace admin/owner only)
   */
  @Put('/:id/members/:userId')
  @UseBefore(authenticate)
  @UseBefore(
    validate(
      z.object({
        role: z.enum(['owner', 'admin', 'member'])
      })
    )
  )
  async updateMemberRole(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
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

      const { role } = req.body

      // Check if this change would remove the last owner
      const targetMembership = workspace.userWorkspaces?.find((uw) => uw.userId === targetUserId)
      if (targetMembership?.role === 'owner' && role !== 'owner') {
        const owners = workspace.userWorkspaces?.filter((uw) => uw.role === 'owner') || []
        if (owners.length === 1) {
          return res
            .status(400)
            .json({
              success: false,
              data: null,
              error: 'Cannot remove the last owner. There must always be at least one owner.'
            })
        }
      }

      const userWorkspace = await updateUserWorkspaceRole(targetUserId, workspaceId, role)
      if (!userWorkspace) {
        return res
          .status(404)
          .json({ success: false, data: null, error: 'User not found in workspace' })
      }

      return res.json({ success: true, data: userWorkspace, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * DELETE /api/workspaces/:id/members/:userId
   * Remove a user from a workspace (workspace admin/owner only)
   */
  @Delete('/:id/members/:userId')
  @UseBefore(authenticate)
  async removeMember(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
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

        // Prevent removing the last owner
        const targetMembership = workspace.userWorkspaces?.find((uw) => uw.userId === targetUserId)
        if (targetMembership?.role === 'owner') {
          const owners = workspace.userWorkspaces?.filter((uw) => uw.role === 'owner') || []
          if (owners.length === 1) {
            return res
              .status(400)
              .json({ success: false, data: null, error: 'Cannot remove the last owner' })
          }
        }
      }

      const success = await removeUserFromWorkspace(targetUserId, workspaceId)
      if (!success) {
        return res
          .status(404)
          .json({ success: false, data: null, error: 'User not found in workspace' })
      }

      return res.json({ success: true, data: null, error: null })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }
}
