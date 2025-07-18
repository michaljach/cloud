import { Request, Response } from 'express'
import * as usersService from '../services/users.service'
import bcrypt from 'bcryptjs'

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' })
  const existing = await usersService.getUserByUsername(username)
  if (existing) return res.status(409).json({ error: 'Username already exists' })
  const hash = await bcrypt.hash(password, 10)
  const user = await usersService.createUser(username, hash)
  res.status(201).json({ id: user.id, username: user.username })
}
