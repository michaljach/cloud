import { Router } from 'express'
import usersRoutes from './users.routes'
import authRoutes from './auth.routes'
import filesRoutes from './files.routes'

const router = Router()

router.use('/users', usersRoutes)
router.use('/auth', authRoutes)
router.use('/files', filesRoutes)

export default router
