import { Router } from 'express'
import * as usersController from '../controllers/users.controller'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.get('/', authenticate, usersController.getUsers)
router.get('/:id', authenticate, usersController.getUserById)
router.post('/', authenticate, usersController.createUser)
router.put('/:id', authenticate, usersController.updateUser)
router.delete('/:id', authenticate, usersController.deleteUser)

export default router
