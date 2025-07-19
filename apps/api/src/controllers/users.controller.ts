import { Request, Response } from 'express'
import * as usersService from '../services/users.service'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { User } from '@repo/types'
const prisma = new PrismaClient()

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' })
  const existing = await usersService.getUserByUsername(username)
  if (existing) return res.status(409).json({ error: 'Username already exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = await usersService.createUser(username, hash)
  // Use shared User type for response
  const safeUser: User = { id: user.id, username: user.username }
  res.status(201).json(safeUser)
}

export const me = async (req: Request, res: Response) => {
  // req.oauth is set by authenticate middleware
  const user = (req as any).oauth?.user as User | undefined
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json(user)
}

export const logout = async (req: Request, res: Response) => {
  const accessToken = (req as any).oauth?.accessToken
  if (!accessToken) return res.status(400).json({ error: 'No access token found' })
  try {
    // Remove the token from the database
    await prisma.oAuthToken.deleteMany({ where: { accessToken } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to logout' })
  }
}
