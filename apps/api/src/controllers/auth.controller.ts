import 'reflect-metadata'
import { JsonController, Post, Get, Patch, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import OAuth2Server from 'oauth2-server'
import oauthModel from '../services/oauth.model'
import bcrypt from 'bcryptjs'
import * as usersService from '../services/users.service'
import type { User } from '@repo/types'
import { handleError } from '@utils/handleError'
import { z } from 'zod'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import { CurrentUser } from '../decorators/currentUser'
import { getUserStorageUsage, getUserFilesStorageUsage } from '../services/files.service'
import { getUserNotesStorageUsage } from '../services/notes.service'
import { getUserPhotosStorageUsage } from '../services/photos.service'
import { prisma } from '@lib/prisma'

const client_id = process.env.OAUTH_CLIENT_ID
const client_secret = process.env.OAUTH_CLIENT_SECRET

const oauth = new OAuth2Server({ model: oauthModel })

@JsonController('/auth')
export default class AuthController {
  /**
   * POST /api/auth/token
   * Obtain OAuth2 token (password grant only)
   */
  @Post('/token')
  @UseBefore(
    validate(
      z.object({
        grant_type: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional()
      })
    )
  )
  async token(@Req() req: Request, @Res() res: Response) {
    const mergedBody = {
      ...req.body,
      client_id: client_id,
      client_secret: client_secret
    }
    const request = new OAuth2Server.Request({
      method: 'POST',
      query: {},
      headers: req.headers,
      body: mergedBody
    })
    const response = new OAuth2Server.Response(res)
    try {
      const token = await oauth.token(request, response)
      return res.json({
        success: true,
        data: {
          accessToken: token.accessToken,
          accessTokenExpiresAt: token.accessTokenExpiresAt
        },
        error: null
      })
    } catch (err) {
      return handleError(res, err, 400)
    }
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  @Post('/register')
  @UseBefore(validate(z.object({ username: z.string().min(1), password: z.string().min(1) })))
  async register(@Req() req: Request, @Res() res: Response) {
    const { username, password } = req.body
    try {
      const existing = await usersService.getUserByUsername(username)
      if (existing) return handleError(res, 'Username already exists', 409)
      const hash = await bcrypt.hash(password, 10)
      const user = await usersService.createUser(username, hash)
      const safeUser: User = {
        id: user.id,
        username: user.username,
        storageLimit: user.storageLimit
      }
      return res.status(201).json({ success: true, data: safeUser, error: null })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info (requires authentication)
   */
  @Get('/me')
  @UseBefore(authenticate)
  async me(@CurrentUser() user: User, @Res() res: Response) {
    try {
      // Get complete user data including workspace info
      const completeUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          userWorkspaces: {
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      })

      if (!completeUser) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      // Get storage usage data
      const totalUsage = getUserStorageUsage(user.id)
      const filesUsage = getUserFilesStorageUsage(user.id)
      const notesUsage = getUserNotesStorageUsage(user.id)
      const photosUsage = getUserPhotosStorageUsage(user.id)

      // Convert bytes to MB for easier reading
      const totalUsageMB = Math.round((totalUsage / (1024 * 1024)) * 100) / 100
      const filesUsageMB = Math.round((filesUsage / (1024 * 1024)) * 100) / 100
      const notesUsageMB = Math.round((notesUsage / (1024 * 1024)) * 100) / 100
      const photosUsageMB = Math.round((photosUsage / (1024 * 1024)) * 100) / 100

      const safeUser: User = {
        id: completeUser.id,
        username: completeUser.username,
        fullName: completeUser.fullName,
        storageLimit: Number(completeUser.storageLimit),
        workspaces: completeUser.userWorkspaces
      }

      return res.json({
        success: true,
        data: {
          user: safeUser,
          storageQuota: {
            totalUsage: {
              bytes: totalUsage,
              megabytes: totalUsageMB
            },
            breakdown: {
              files: {
                bytes: filesUsage,
                megabytes: filesUsageMB
              },
              notes: {
                bytes: notesUsage,
                megabytes: notesUsageMB
              },
              photos: {
                bytes: photosUsage,
                megabytes: photosUsageMB
              }
            }
          }
        },
        error: null
      })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }

  /**
   * PATCH /api/auth/me
   * Update current user info (requires authentication)
   */
  @Patch('/me')
  @UseBefore(authenticate)
  @UseBefore(validate(z.object({ fullName: z.string().min(1).optional() })))
  async updateMe(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const prismaUser = await prisma.user.update({
        where: { id: user.id },
        data: { fullName: req.body.fullName }
      })
      const safeUser: User = {
        id: prismaUser.id,
        username: prismaUser.username,
        fullName: prismaUser.fullName,
        storageLimit: prismaUser.storageLimit
      }
      return res.json({ success: true, data: safeUser, error: null })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }

  /**
   * POST /api/auth/change-password
   * Change current user's password (requires authentication)
   */
  @Post('/change-password')
  @UseBefore(authenticate)
  @UseBefore(
    validate(
      z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters')
      })
    )
  )
  async changePassword(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const { currentPassword, newPassword } = req.body

      // Get the user with their current password hash
      const prismaUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, username: true, password: true, fullName: true, storageLimit: true }
      })

      if (!prismaUser) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, prismaUser.password)
      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ success: false, data: null, error: 'Current password is incorrect' })
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // Update the user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword }
      })

      const safeUser: User = {
        id: prismaUser.id,
        username: prismaUser.username,
        fullName: prismaUser.fullName,
        storageLimit: prismaUser.storageLimit
      }

      return res.json({ success: true, data: { user: safeUser }, error: null })
    } catch (err) {
      return handleError(res, err, 500)
    }
  }

  /**
   * POST /api/auth/logout
   * Logout and revoke token
   */
  @Post('/logout')
  @UseBefore(validate(z.object({ token: z.string().min(1) })))
  async logout(@Req() req: Request, @Res() res: Response) {
    const { token } = req.body
    try {
      await prisma.oAuthToken.deleteMany({
        where: {
          accessToken: token
        }
      })
      return res.json({ success: true, data: null, error: null })
    } catch (e) {
      return handleError(res, e, 500)
    }
  }
}
