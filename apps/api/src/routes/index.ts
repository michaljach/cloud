import { Router } from 'express'
import usersRoutes from './users.routes'
import authRoutes from './auth.routes'
import notesRoutes from './notes.routes'
import photosRoutes from './photos.routes'
import filesRoutes from './files.routes'

const router = Router()

router.use('/users', usersRoutes)
router.use('/auth', authRoutes)
router.use('/notes', notesRoutes)
router.use('/photos', photosRoutes)
router.use('/files', filesRoutes)

export default router
