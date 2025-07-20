import { Request, Response } from 'express'
import OAuth2Server from 'oauth2-server'
import oauthModel from '@services/oauth.model'
import bcrypt from 'bcryptjs'
import * as usersService from '@services/users.service'
import { PrismaClient } from '@prisma/client'
import { User } from '@repo/types'
import { handleError } from '@utils/handleError'
import { z } from 'zod'

const oauth = new OAuth2Server({ model: oauthModel })
const prisma = new PrismaClient()

/**
 * POST /api/auth/token - Handles both password and refresh_token grants
 * @param req Express request
 * @param res Express response
 */
export const token = async (req: Request, res: Response) => {
  const client_id = process.env.OAUTH_CLIENT_ID
  const client_secret = process.env.OAUTH_CLIENT_SECRET
  if (!client_id || !client_secret) {
    return handleError(res, 'OAuth client credentials not configured', 500)
  }
  const body = {
    ...req.body,
    client_id: req.body.client_id || client_id,
    client_secret: req.body.client_secret || client_secret
  }
  const request = new OAuth2Server.Request({
    method: 'POST',
    query: {},
    headers: req.headers,
    body
  })
  const response = new OAuth2Server.Response(res)
  try {
    const token = await oauth.token(request, response)
    res.json({
      success: true,
      data: {
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        ...token
      },
      error: null
    })
  } catch (err) {
    handleError(res, err, 400)
  }
}

/**
 * POST /api/auth/register - Register a new user
 * @param req Express request
 * @param res Express response
 */
export const register = async (req: Request, res: Response) => {
  const schema = z.object({ username: z.string().min(1), password: z.string().min(1) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    return handleError(res, 'Username and password required', 400)
  }
  const { username, password } = parse.data
  try {
    const existing = await usersService.getUserByUsername(username)
    if (existing) return handleError(res, 'Username already exists', 409)
    const hash = await bcrypt.hash(password, 10)
    const user = await usersService.createUser(username, hash)
    const safeUser: User = { id: user.id, username: user.username }
    res.status(201).json({ success: true, data: safeUser, error: null })
  } catch (err) {
    handleError(res, err, 500)
  }
}

/**
 * GET /api/auth/me - Get current user info (requires authentication)
 * @param req Express request
 * @param res Express response
 */
export const me = async (req: Request, res: Response) => {
  const user = (req as any).oauth?.user as User | undefined
  if (!user) return handleError(res, 'Not authenticated', 401)
  res.json({ success: true, data: user, error: null })
}

/**
 * PATCH /api/auth/me - Update current user info (requires authentication)
 * @param req Express request
 * @param res Express response
 */
export const updateMe = async (req: Request, res: Response) => {
  const user = (req as any).oauth?.user as User | undefined
  if (!user) return handleError(res, 'Not authenticated', 401)
  const schema = z.object({ fullName: z.string().min(1).optional() })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    return handleError(res, 'Invalid input', 400)
  }
  try {
    const prismaUser = await prisma.user.update({
      where: { id: user.id },
      data: { fullName: parse.data.fullName }
    })
    const safeUser: User = {
      id: prismaUser.id,
      username: prismaUser.username,
      fullName: prismaUser.fullName
    }
    res.json({ success: true, data: safeUser, error: null })
  } catch (err) {
    handleError(res, err, 500)
  }
}

/**
 * POST /api/auth/logout - Revoke token (access or refresh)
 * @param req Express request
 * @param res Express response
 */
export const logout = async (req: Request, res: Response) => {
  const schema = z.object({ token: z.string().min(1) })
  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    return handleError(res, 'No token provided', 400)
  }
  const { token } = parse.data
  try {
    await prisma.oAuthToken.deleteMany({
      where: {
        OR: [{ accessToken: token }, { refreshToken: token }]
      }
    })
    res.json({ success: true, data: null, error: null })
  } catch (e) {
    handleError(res, e, 500)
  }
}
