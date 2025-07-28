import 'reflect-metadata'
import { JsonController, Post, Get, Patch, Body, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import OAuth2Server from 'oauth2-server'
import oauthModel from '@services/oauth.model'
import bcrypt from 'bcryptjs'
import * as usersService from '@services/users.service'
import { PrismaClient } from '@prisma/client'
import type { User } from '@repo/types'
import { handleError } from '@utils/handleError'
import { z } from 'zod'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import { CurrentUser } from '../decorators/currentUser'

const client_id = process.env.OAUTH_CLIENT_ID
const client_secret = process.env.OAUTH_CLIENT_SECRET

const oauth = new OAuth2Server({ model: oauthModel })
const prisma = new PrismaClient()

@JsonController('/auth')
export default class AuthController {
  /**
   * POST /api/auth/token
   * Obtain OAuth2 token (password or refresh_token grant)
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
          refreshToken: token.refreshToken,
          ...token
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
        role: user.role,
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
        include: { workspace: true }
      })

      if (!completeUser) {
        return res.status(404).json({ success: false, data: null, error: 'User not found' })
      }

      const safeUser: User = {
        id: completeUser.id,
        username: completeUser.username,
        fullName: completeUser.fullName,
        role: completeUser.role,
        storageLimit: Number(completeUser.storageLimit),
        workspaceId: completeUser.workspaceId,
        workspace: completeUser.workspace
          ? {
              id: completeUser.workspace.id,
              name: completeUser.workspace.name
            }
          : undefined
      }

      return res.json({ success: true, data: safeUser, error: null })
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
        role: prismaUser.role,
        storageLimit: prismaUser.storageLimit
      }
      return res.json({ success: true, data: safeUser, error: null })
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
          OR: [{ accessToken: token }, { refreshToken: token }]
        }
      })
      return res.json({ success: true, data: null, error: null })
    } catch (e) {
      return handleError(res, e, 500)
    }
  }
}
