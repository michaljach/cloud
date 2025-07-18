import { Request, Response } from 'express'
import * as usersService from '../services/users.service'

export const getUsers = (req: Request, res: Response) => {
  const users = usersService.getUsers()
  res.json(users)
}

export const getUserById = (req: Request, res: Response) => {
  const user = usersService.getUserById(Number(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
}

export const createUser = (req: Request, res: Response) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name is required' })
  const newUser = usersService.createUser(name)
  res.status(201).json(newUser)
}

export const updateUser = (req: Request, res: Response) => {
  const user = usersService.updateUser(Number(req.params.id), req.body.name)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
}

export const deleteUser = (req: Request, res: Response) => {
  const success = usersService.deleteUser(Number(req.params.id))
  if (!success) return res.status(404).json({ error: 'User not found' })
  res.status(204).send()
}
