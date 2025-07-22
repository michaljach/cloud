import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import { encryptAndSavePhoto, decryptAndReadPhoto } from '@services/photosStorage.service'
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
    // req.file is now validated by Zod
    encryptAndSavePhoto(req.file.buffer, req.file.originalname, user.id)
    return res.json({
      success: true,
      data: { filename: req.file.originalname, message: 'Photo uploaded and encrypted' },
      error: null
    })
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
      const data = decryptAndReadPhoto(params.data.filename, user.id)
      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'Photo not found or decryption failed' })
    }
  }
}
