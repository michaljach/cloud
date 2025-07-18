import { Router } from 'express'
import multer from 'multer'
import * as fileController from '../controllers/file.controller'
import { authenticate } from '../middleware/authenticate'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()

router.post('/upload', authenticate, upload.single('file'), fileController.uploadFile)
router.get('/download/:filename', authenticate, fileController.downloadFile)

export default router
