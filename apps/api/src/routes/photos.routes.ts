import { Router } from 'express'
import multer from 'multer'
import * as photosController from '@controllers/photos.controller'
import { authenticate } from '@middleware/authenticate'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()

router.post('/', authenticate, upload.single('file'), photosController.uploadPhoto)
router.get('/:filename', authenticate, photosController.downloadPhoto)

export default router
