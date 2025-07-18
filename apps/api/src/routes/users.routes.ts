import { Router } from 'express'
import * as usersController from '../controllers/users.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.post('/register', usersController.register)

export default router
