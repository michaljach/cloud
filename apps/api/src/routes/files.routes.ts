import { Router } from 'express'
import multer from 'multer'
import * as filesController from '@controllers/files.controller'
import { authenticate } from '@middleware/authenticate'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()

router.post('/', authenticate, upload.single('file'), filesController.uploadUserFile)
router.get('/', authenticate, filesController.listUserFiles)
router.get('/:filename', authenticate, filesController.downloadUserFile)

export default router
