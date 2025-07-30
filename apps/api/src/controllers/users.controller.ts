import 'reflect-metadata'
import { JsonController, Get, Post, Patch, Param, Res, UseBefore, Req } from 'routing-controllers'
import type { Response, Request } from 'express'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import {
  listUsers,
  getUserStorageLimit,
  updateUser,
  getUserById,
  createUser,
  getUserByUsername
} from '@services/users.service'
import { isRootAdmin, isAdmin, getAdminWorkspaces } from '../utils'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@lib/prisma'

@JsonController('/users')
export default class UsersController {
  /**
   * GET /api/users
   * List users (root_admin: all, admin: only in workspace, user: forbidden)
   */
  @Get('/')
  @UseBefore(authenticate)
  async list(@CurrentUser() oauthUser: User, @Res() res: Response) {
    // Fetch complete user data including workspace information
    const user = await getUserById(oauthUser.id)

    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    if (isRootAdmin(user)) {
      const users = await listUsers()
      return res.json({ success: true, data: users, error: null })
    } else if (isAdmin(user)) {
      // Get users from all workspaces where the user is admin/owner
      const adminWorkspaces = getAdminWorkspaces(user)
      const allUsers = new Map<string, User>()

      for (const userWorkspace of adminWorkspaces) {
        const workspaceUsers = await listUsers(userWorkspace.workspaceId)
        workspaceUsers.forEach((u) => {
          if (!allUsers.has(u.id)) {
            allUsers.set(u.id, u)
          }
        })
      }

      return res.json({ success: true, data: Array.from(allUsers.values()), error: null })
    } else {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }
  }

  /**
   * POST /api/users
   * Create a new user (root_admin only)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(
    validate(
      z.object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        fullName: z.string().optional(),
        storageLimitMB: z
          .number()
          .min(1, 'Storage limit must be at least 1 MB')
          .max(1000000, 'Storage limit cannot exceed 1000GB')
          .optional()
      })
    )
  )
  async create(@CurrentUser() oauthUser: User, @Req() req: Request, @Res() res: Response) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    if (!isRootAdmin(user)) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    const { username, password, fullName, storageLimitMB = 1024 } = req.body

    try {
      // Check if username already exists
      const existingUser = await getUserByUsername(username)
      if (existingUser) {
        return res
          .status(409)
          .json({ success: false, data: null, error: 'Username already exists' })
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user data
      const userData: any = {
        username,
        password: hashedPassword,
        storageLimit: storageLimitMB
      }

      if (fullName) {
        userData.fullName = fullName
      }

      const newUser = await createUser(username, hashedPassword)

      // Update additional fields if provided
      if (fullName || storageLimitMB !== 1024) {
        const updateData: any = {}
        if (fullName) updateData.fullName = fullName
        if (storageLimitMB !== 1024) updateData.storageLimit = storageLimitMB

        await updateUser(newUser.id, updateData)
      }

      // Get the complete user data
      const completeUser = await getUserById(newUser.id)

      return res.status(201).json({
        success: true,
        data: { user: completeUser },
        error: null
      })
    } catch (err: any) {
      return res.status(500).json({ success: false, data: null, error: err.message })
    }
  }

  /**
   * GET /api/users/:userId/storage-limit
   * Get storage limit for a user (admin/root_admin only)
   */
  @Get('/:userId/storage-limit')
  @UseBefore(authenticate)
  async getStorageLimit(
    @CurrentUser() oauthUser: User,
    @Param('userId') userId: string,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    if (!isRootAdmin(user) && !isAdmin(user)) {
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
    @CurrentUser() oauthUser: User,
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const user = await getUserById(oauthUser.id)
    if (!user) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    if (!isRootAdmin(user) && !isAdmin(user)) {
      return res.status(403).json({ success: false, data: null, error: 'Forbidden' })
    }

    const body = req.body as {
      fullName?: string
      storageLimitMB?: number
    }

    // Get the target user to check workspace permissions
    const targetUser = await getUserById(userId)
    if (!targetUser) {
      return res.status(404).json({ success: false, data: null, error: 'User not found' })
    }

    // Workspace security check: admin can only edit users in the same workspaces
    if (!isRootAdmin(user)) {
      // Get target user with workspace data
      const targetUserWithWorkspaces = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userWorkspaces: {
            select: {
              workspaceId: true
            }
          }
        }
      })

      if (!targetUserWithWorkspaces) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      // Check if there's any overlap in workspaces where current user is admin/owner
      const currentAdminWorkspaceIds = getAdminWorkspaces(user).map((uw) => uw.workspaceId)
      const targetWorkspaceIds = targetUserWithWorkspaces.userWorkspaces.map((uw) => uw.workspaceId)
      const hasOverlap = currentAdminWorkspaceIds.some((id) => targetWorkspaceIds.includes(id))

      if (!hasOverlap) {
        return res.status(403).json({
          success: false,
          data: null,
          error: 'Admin can only edit users in the same workspaces'
        })
      }
    }

    const schema = z.object({
      fullName: z.string().min(1).optional(),
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
