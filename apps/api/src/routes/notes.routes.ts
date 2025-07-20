import { Router } from 'express'
import multer from 'multer'
import * as notesController from '@controllers/notes.controller'
import { authenticate } from '@middleware/authenticate'

const upload = multer({ storage: multer.memoryStorage() })
const router = Router()

router.post('/', authenticate, upload.single('file'), notesController.uploadNote)
router.get('/', authenticate, notesController.listNotes)
router.get('/:filename', authenticate, notesController.downloadNote)

export default router
