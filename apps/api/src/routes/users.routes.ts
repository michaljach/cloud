import { Router } from 'express'
import * as usersController from '../controllers/users.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

// (No /register or /me here anymore)
// Add any user-specific endpoints here

export default router
