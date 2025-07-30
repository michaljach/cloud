import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import { savePhoto, readPhoto } from '@services/photos.service'
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
    fileSize: 100 * 1024 * 1024, // 100MB limit per file for photos
    files: 1 // Maximum 1 file per request for photos
  }
})

const fileSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(1, 'File size must be greater than 0')
})

@JsonController('/photos')
export default class PhotosController {
  /**
   * POST /api/photos
   * Upload a new photo for the authenticated user (encrypted)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(upload.single('file'))
  @UseBefore(validate(fileSchema))
  async uploadPhoto(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
    }
    try {
      // Read file from disk and encrypt it
      const fileBuffer = fs.readFileSync(req.file.path)
      savePhoto(fileBuffer, req.file.originalname, user.id)

      // Clean up temporary file
      fs.unlinkSync(req.file.path)

      return res.json({
        success: true,
        data: { filename: req.file.originalname, message: 'Photo uploaded and encrypted' },
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
   * GET /api/photos/:filename
   * Download a specific photo for the authenticated user (decrypted)
   */
  @Get('/:filename')
  @UseBefore(authenticate)
  async downloadPhoto(
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
      const data = readPhoto(params.data.filename, user.id)
      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'Photo not found or decryption failed' })
    }
  }
}
