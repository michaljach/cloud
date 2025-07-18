import { Router } from 'express'
import * as authController from '../controllers/auth.controller'

const router = Router()

router.post('/oauth/token', authController.token)
router.get('/oauth/authorize', authController.authorize)

export default router
