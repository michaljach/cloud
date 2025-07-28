import 'reflect-metadata'
import {
  JsonController,
  Get,
  Post,
  Patch,
  Param,
  Res,
  UseBefore,
  Body,
  Req
} from 'routing-controllers'
import type { Response, Request } from 'express'
import { authenticate } from '@middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import { listUsers, getUserStorageLimit, updateUser, getUserById } from '@services/users.service'
import { z } from 'zod'

@JsonController('/users')
export default class UsersController {
  /**
   * GET /api/users
   * List users (root_admin: all, admin: only in workspace, user: forbidden)
   */
  @Get('/')
  @UseBefore(authenticate)
  async list(@CurrentUser() user: User, @Res() res: Response) {
    if (user.role === 'root_admin') {
      const users = await listUsers()
      return res.json({ success: true, data: users, error: null })
    } else if (user.role === 'admin') {
      if (!user.workspaceId) {
        return res.status(400).json({ success: false, data: null, error: 'Admin has no workspace' })
      }
      const users = await listUsers(user.workspaceId)
      return res.json({ success: true, data: users, error: null })
    } else {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }
  }

  /**
   * GET /api/users/:userId/storage-limit
   * Get storage limit for a user (admin/root_admin only)
   */
  @Get('/:userId/storage-limit')
  @UseBefore(authenticate)
  async getStorageLimit(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    if (currentUser.role !== 'root_admin' && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    try {
      const storageLimit = await getUserStorageLimit(userId)
      return res.json({
        success: true,
        data: {
          userId,
          storageLimit,
          storageLimitMB: Math.round((storageLimit / (1024 * 1024)) * 100) / 100
        },
        error: null
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * PATCH /api/users/:userId
   * Update user properties (admin/root_admin only)
   */
  @Patch('/:userId')
  @UseBefore(authenticate)
  async updateUserProperties(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    if (currentUser.role !== 'root_admin' && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    const body = req.body as {
      fullName?: string
      role?: string
      workspaceId?: string
      storageLimitMB?: number
    }

    // Get the target user to check workspace permissions
    const targetUser = await getUserById(userId)
    if (!targetUser) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    // Workspace security check: admin can only edit users in the same workspace
    if (currentUser.role === 'admin') {
      if (!currentUser.workspaceId) {
        return res.status(400).json({ success: false, data: null, error: 'Admin has no workspace' })
      }
      if (targetUser.workspaceId !== currentUser.workspaceId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: 'Admin can only edit users in the same workspace'
        })
      }
    }

    // Only root_admin can change roles
    if (body.role && currentUser.role !== 'root_admin') {
      return res
        .status(403)
        .json({ success: false, data: null, error: 'Only root admin can change roles' })
    }

    // Only root_admin can change workspace assignments
    if (body.workspaceId && currentUser.role !== 'root_admin') {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Only root admin can change workspace assignments'
      })
    }

    const schema = z.object({
      fullName: z.string().min(1).optional(),
      role: z.enum(['root_admin', 'admin', 'user']).optional(),
      workspaceId: z.string().uuid().optional(),
      storageLimitMB: z
        .number()
        .min(1, 'Storage limit must be at least 1 MB')
        .max(1000000, 'Storage limit cannot exceed 1000GB')
        .optional()
    })

    const validation = schema.safeParse(body)
    if (!validation.success) {
      return res.status(400).json({ success: false, data: null, error: validation.error.message })
    }

    try {
      // Use storageLimitMB directly since we now store in MB
      const updateData: any = { ...validation.data }
      if (updateData.storageLimitMB !== undefined) {
        updateData.storageLimit = updateData.storageLimitMB
        delete updateData.storageLimitMB
      }

      const updatedUser = await updateUser(userId, updateData)
      return res.json({
        success: true,
        data: { user: updatedUser },
        error: null
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }
}
