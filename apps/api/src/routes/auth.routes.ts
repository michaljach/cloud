import { Router } from 'express'
import * as authController from '@controllers/auth.controller'
import { authenticate } from '@middleware/authenticate'

const router = Router()

router.post('/token', authController.token)
router.post('/register', authController.register)
router.get('/me', authenticate, authController.me)
router.patch('/me', authenticate, authController.updateMe)
router.post('/logout', authController.logout)

export default router
