import 'reflect-metadata'
import { JsonController, Get, Post, Patch, Param, Res, UseBefore, Body } from 'routing-controllers'
import type { Response } from 'express'
import { authenticate } from '@middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import { listUsers, updateUserStorageLimit, getUserStorageLimit } from '@services/users.service'
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
   * PATCH /api/users/:userId/storage-limit
   * Update storage limit for a user (admin/root_admin only)
   */
  @Patch('/:userId/storage-limit')
  @UseBefore(authenticate)
  async updateStorageLimit(
    @CurrentUser() currentUser: User,
    @Param('userId') userId: string,
    @Body() body: { storageLimitMB: number },
    @Res() res: Response
  ) {
    if (currentUser.role !== 'root_admin' && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    const schema = z.object({
      storageLimitMB: z
        .number()
        .min(0.1, 'Storage limit must be at least 0.1 MB')
        .max(10000, 'Storage limit cannot exceed 10GB')
    })

    const validation = schema.safeParse(body)
    if (!validation.success) {
      return res.status(400).json({ success: false, data: null, error: validation.error.message })
    }

    try {
      const storageLimitBytes = Math.round(validation.data.storageLimitMB * 1024 * 1024)
      const updatedUser = await updateUserStorageLimit(userId, storageLimitBytes)

      return res.json({
        success: true,
        data: {
          user: updatedUser,
          storageLimit: storageLimitBytes,
          storageLimitMB: validation.data.storageLimitMB
        },
        error: null
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }
}
