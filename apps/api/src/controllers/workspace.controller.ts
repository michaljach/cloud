import 'reflect-metadata'
import {
  JsonController,
  Get,
  Post,
  Delete,
  Put,
  Res,
  UseBefore,
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
  updateWorkspace
} from '../services/workspace.service'
import { getUserById } from '../services/users.service'
import { isRootAdmin } from '../utils'
import { validate } from '@middleware/validate'
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendForbiddenResponse,
  sendServerErrorResponse,
  validationSchemas
} from '../utils'

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
      return sendNotFoundResponse(res, 'User not found')
    }

    if (!isRootAdmin(user)) {
      return sendForbiddenResponse(res, 'Forbidden')
    }

    try {
      const workspaces = await listWorkspaces()
      return sendSuccessResponse(res, workspaces)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
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
      return sendNotFoundResponse(res, 'User not found')
    }

    try {
      const workspace = await getWorkspaceWithMembers(workspaceId)
      if (!workspace) {
        return sendNotFoundResponse(res, 'Workspace not found')
      }

      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership) {
          return sendForbiddenResponse(res, 'Not a member of this workspace')
        }
      }

      return sendSuccessResponse(res, workspace.userWorkspaces)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * PUT /api/workspaces/:id
   * Update workspace properties (admin/root_admin only)
   */
  @Put('/:id')
  @UseBefore(authenticate)
  @UseBefore(validate(validationSchemas.updateWorkspace))
  async update(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Req() req: Request,
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

      // Check permissions: root admin can edit any workspace, admin can only edit workspaces they're admin/owner of
      if (!isRootAdmin(user)) {
        const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
        if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
          return sendForbiddenResponse(res, 'Insufficient permissions')
        }
      }

      const { name } = req.body
      const updatedWorkspace = await updateWorkspace(workspaceId, name)
      return sendSuccessResponse(res, updatedWorkspace)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * POST /api/workspaces
   * Create a new workspace (any authenticated user)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(validate(validationSchemas.createWorkspace))
  async create(@CurrentUser() oauthUser: User, @Req() req: Request, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return sendNotFoundResponse(res, 'User not found')
    }

    const { name } = req.body

    try {
      const workspace = await createWorkspace(name)

      // Add the creator as the owner of the workspace
      await addUserToWorkspace(user.id, workspace.id, 'owner')

      return sendSuccessResponse(res, workspace, 201)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * POST /api/workspaces/:id/members
   * Add a user to a workspace (workspace admin/owner only)
   */
  @Post('/:id/members')
  @UseBefore(authenticate)
  @UseBefore(validate(validationSchemas.addUserToWorkspace))
  async addMember(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Req() req: Request,
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

      const { userId, role } = req.body
      const userWorkspace = await addUserToWorkspace(userId, workspaceId, role)
      return sendSuccessResponse(res, userWorkspace, 201)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * PUT /api/workspaces/:id/members/:userId
   * Update user role in workspace (workspace admin/owner only)
   */
  @Put('/:id/members/:userId')
  @UseBefore(authenticate)
  @UseBefore(validate(validationSchemas.updateUserRole))
  async updateMemberRole(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
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

      const { role } = req.body

      // Check if this change would remove the last owner
      const targetMembership = workspace.userWorkspaces?.find((uw) => uw.userId === targetUserId)
      if (targetMembership?.role === 'owner' && role !== 'owner') {
        const owners = workspace.userWorkspaces?.filter((uw) => uw.role === 'owner') || []
        if (owners.length === 1) {
          return sendErrorResponse(
            res,
            'Cannot remove the last owner. There must always be at least one owner.',
            400
          )
        }
      }

      const userWorkspace = await updateUserWorkspaceRole(targetUserId, workspaceId, role)
      if (!userWorkspace) {
        return sendNotFoundResponse(res, 'User not found in workspace')
      }

      return sendSuccessResponse(res, userWorkspace)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
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

        // Prevent removing the last owner
        const targetMembership = workspace.userWorkspaces?.find((uw) => uw.userId === targetUserId)
        if (targetMembership?.role === 'owner') {
          const owners = workspace.userWorkspaces?.filter((uw) => uw.role === 'owner') || []
          if (owners.length === 1) {
            return sendErrorResponse(res, 'Cannot remove the last owner', 400)
          }
        }
      }

      const success = await removeUserFromWorkspace(targetUserId, workspaceId)
      if (!success) {
        return sendNotFoundResponse(res, 'User not found in workspace')
      }

      return sendSuccessResponse(res, null)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }

  /**
   * DELETE /api/workspaces/:id/leave
   * Leave a workspace (current user)
   */
  @Delete('/:id/leave')
  @UseBefore(authenticate)
  async leaveWorkspace(
    @CurrentUser() oauthUser: User,
    @Param('id') workspaceId: string,
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

      // Check if user is a member of this workspace
      const userMembership = workspace.userWorkspaces?.find((uw) => uw.userId === user.id)
      if (!userMembership) {
        return sendNotFoundResponse(res, 'You are not a member of this workspace')
      }

      // Prevent leaving if user is the last owner
      if (userMembership.role === 'owner') {
        const owners = workspace.userWorkspaces?.filter((uw) => uw.role === 'owner') || []
        if (owners.length === 1) {
          return sendErrorResponse(
            res,
            'Cannot leave workspace. You are the last owner. Please transfer ownership or delete the workspace.',
            400
          )
        }
      }

      const success = await removeUserFromWorkspace(user.id, workspaceId)
      if (!success) {
        return sendNotFoundResponse(res, 'User not found in workspace')
      }

      return sendSuccessResponse(res, null)
    } catch (err: any) {
      return sendServerErrorResponse(res, err)
    }
  }
}
