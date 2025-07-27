import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import {
  encryptAndSaveNote,
  decryptAndReadNote,
  listUserNotes,
  getUserNotesStorageUsage
} from '@services/notesStorage.service'

import { base64urlDecode } from '@repo/utils'
import { z } from 'zod'
import { CurrentUser } from '../decorators/currentUser'
import multer from 'multer'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import fs from 'fs'
import path from 'path'

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
      // Generate unique filename to avoid conflicts
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      cb(null, `${uniqueSuffix}-${file.originalname}`)
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 1 // Maximum 1 file per request for notes
  }
})

const fileSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(1, 'File size must be greater than 0')
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
    try {
      // Read file from disk and encrypt it
      const fileBuffer = fs.readFileSync(req.file.path)
      encryptAndSaveNote(fileBuffer, req.file.originalname, user.id)

      // Clean up temporary file
      fs.unlinkSync(req.file.path)

      return res.json({
        success: true,
        data: { filename: req.file.originalname, message: 'Note uploaded and encrypted' },
        error: null
      })
    } catch (err: any) {
      // Clean up temporary file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(500).json({
        success: false,
        data: null,
        error: `Upload failed: ${err.message}`
      })
    }
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

  /**
   * GET /api/notes/storage/quota
   * Get storage usage information for notes for the authenticated user
   */
  @Get('/storage/quota')
  @UseBefore(authenticate)
  async getStorageQuota(@CurrentUser() user: User, @Res() res: Response) {
    try {
      const notesUsage = getUserNotesStorageUsage(user.id)

      // Convert bytes to MB for easier reading
      const notesUsageMB = Math.round((notesUsage / (1024 * 1024)) * 100) / 100

      return res.json({
        success: true,
        data: {
          notesUsage: {
            bytes: notesUsage,
            megabytes: notesUsageMB
          }
        },
        error: null
      })
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, data: null, error: 'Failed to get storage quota' })
    }
  }
}
