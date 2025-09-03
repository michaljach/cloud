import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import { savePhoto, readPhoto } from '../services/photos.service'
import { CurrentUser } from '../decorators/currentUser'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import {
  photosUpload,
  fileSchema,
  processUploadedFile,
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  sendValidationErrorResponse
} from '../utils'

// Use common upload configuration and validation schemas

@JsonController('/photos')
export default class PhotosController {
  /**
   * POST /api/photos
   * Upload a new photo for the authenticated user (encrypted)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(photosUpload.single('file'))
  @UseBefore(validate(fileSchema))
  async uploadPhoto(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return sendErrorResponse(res, 'No file uploaded', 400)
    }

    try {
      const result = processUploadedFile(req.file, (fileBuffer, filename) => {
        savePhoto(fileBuffer, filename, user.id)
        return { filename, message: 'Photo uploaded and encrypted' }
      })

      return sendSuccessResponse(res, result)
    } catch (err: any) {
      return sendErrorResponse(res, `Upload failed: ${err.message}`, 500)
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
    try {
      const data = readPhoto(filename, user.id)
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(data)
    } catch (e) {
      return sendNotFoundResponse(res, 'Photo not found or decryption failed')
    }
  }
}
