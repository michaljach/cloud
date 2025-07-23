import 'reflect-metadata'
import { JsonController, Get, Res, UseBefore } from 'routing-controllers'
import type { Response } from 'express'
import { authenticate } from '@middleware/authenticate'
import { CurrentUser } from '../decorators/currentUser'
import type { User } from '@repo/types'
import { listUsers } from '@services/users.service'

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
}
