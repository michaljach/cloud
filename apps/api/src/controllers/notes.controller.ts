import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import {
  encryptAndSaveNote,
  decryptAndReadNote,
  listUserNotes
} from '@services/notesStorage.service'

import { base64urlDecode } from '@repo/utils'
import { z } from 'zod'
import { CurrentUser } from '../decorators/currentUser'
import multer from 'multer'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'

const upload = multer({ storage: multer.memoryStorage() })

const fileSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  buffer: z.instanceof(Buffer, { message: 'File buffer is required' })
})

@JsonController('/notes')
export default class NotesController {
  /**
   * POST /api/notes
   * Upload a new note for the authenticated user (encrypted)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(upload.single('file'))
  @UseBefore(validate(fileSchema))
  async uploadNote(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
    }
    encryptAndSaveNote(req.file.buffer, req.file.originalname, user.id)
    return res.json({
      success: true,
      data: { filename: req.file.originalname, message: 'Note uploaded and encrypted' },
      error: null
    })
  }

  /**
   * GET /api/notes/:filename
   * Download a specific note for the authenticated user (decrypted)
   */
  @Get('/:filename')
  @UseBefore(authenticate)
  async downloadNote(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    const paramSchema = z.object({ filename: z.string().min(1, 'Filename is required') })
    const params = paramSchema.safeParse({ filename })
    if (!params.success) {
      return res.status(400).json({ success: false, data: null, error: params.error.message })
    }
    try {
      const decodedFilename = base64urlDecode(params.data.filename)
      const data = decryptAndReadNote(decodedFilename, user.id)
      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'Note not found or decryption failed' })
    }
  }

  /**
   * GET /api/notes
   * List all notes for the authenticated user
   */
  @Get('/')
  @UseBefore(authenticate)
  async listNotes(@CurrentUser() user: User, @Res() res: Response) {
    try {
      const files = listUserNotes(user.id)
      return res.json({ success: true, data: files, error: null })
    } catch (e) {
      return res.status(500).json({ success: false, data: null, error: 'Failed to list notes' })
    }
  }
}
