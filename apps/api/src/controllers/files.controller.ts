import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import { encryptAndSaveUserFile, decryptAndReadUserFile } from '@services/filesStorage.service'
import fs from 'fs'
import path from 'path'
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

@JsonController('/files')
export default class FilesController {
  /**
   * POST /api/files
   * Upload a new file for the authenticated user (encrypted)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(upload.single('file'))
  @UseBefore(validate(fileSchema))
  async uploadUserFile(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
    }
    // req.file is now validated by Zod
    encryptAndSaveUserFile(req.file.buffer, req.file.originalname, user.id)
    return res.json({
      success: true,
      data: { filename: req.file.originalname, message: 'File uploaded and encrypted' },
      error: null
    })
  }

  /**
   * GET /api/files
   * List all files for the authenticated user
   */
  @Get('/')
  @UseBefore(authenticate)
  async listUserFiles(@CurrentUser() user: User, @Res() res: Response) {
    try {
      const userDir = path.resolve(__dirname, '../../storage', String(user.id), 'files')
      if (!fs.existsSync(userDir)) {
        return res.json({ success: true, data: [], error: null })
      }
      const files = fs
        .readdirSync(userDir)
        .filter((f) => fs.statSync(path.join(userDir, f)).isFile())
        .map((f) => {
          const stat = fs.statSync(path.join(userDir, f))
          return {
            filename: f,
            size: stat.size,
            modified: stat.mtime
          }
        })
      return res.json({ success: true, data: files, error: null })
    } catch (e) {
      return res.status(500).json({ success: false, data: null, error: 'Failed to list files' })
    }
  }

  /**
   * GET /api/files/:filename
   * Download a specific file for the authenticated user (decrypted)
   */
  @Get('/:filename')
  @UseBefore(authenticate)
  async downloadUserFile(
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
      const data = decryptAndReadUserFile(params.data.filename, user.id)
      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'File not found or decryption failed' })
    }
  }
}
