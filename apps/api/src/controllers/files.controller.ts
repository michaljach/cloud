import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore, Delete } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import {
  encryptAndSaveUserFile,
  decryptAndReadUserFile,
  listUserFiles,
  listUserFolderContents,
  moveUserFileToTrash,
  listUserTrashedFiles,
  restoreUserFileFromTrash,
  deleteUserFileFromTrash
} from '@services/filesStorage.service'

import { z } from 'zod'
import { CurrentUser } from '../decorators/currentUser'
import multer from 'multer'
import { authenticate } from '@middleware/authenticate'
import { validate } from '@middleware/validate'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'

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
  async uploadUserFile(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, error: 'No file uploaded' })
    }
    // Validate file using Zod schema
    const result = fileSchema.safeParse(req.file)
    if (!result.success) {
      return res.status(400).json({ success: false, data: null, error: result.error.message })
    }
    encryptAndSaveUserFile(req.file.buffer, req.file.originalname, user.id)
    return res.json({
      success: true,
      data: { filename: req.file.originalname, message: 'File uploaded and encrypted' },
      error: null
    })
  }

  /**
   * GET /api/files
   * List all files and folders for the authenticated user at a given path
   */
  @Get('/')
  @UseBefore(authenticate)
  async listUserFiles(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const path = typeof req.query.path === 'string' ? req.query.path : ''
      const items = listUserFolderContents(user.id, path)
      return res.json({ success: true, data: items, error: null })
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, data: null, error: 'Failed to list files/folders' })
    }
  }

  /**
   * GET /api/files/download-folder
   * Download a folder as a zip file for the authenticated user
   * Query: path=folder1/folder2
   */
  @Get('/download-folder')
  @UseBefore(authenticate)
  async downloadFolder(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const folderPath = typeof req.query.path === 'string' ? req.query.path : ''
      // Get the absolute path to the user's folder
      const baseDir = path.join(__dirname, '../../../storage', String(user.id), 'files')
      const targetDir = folderPath ? path.join(baseDir, folderPath) : baseDir
      console.log('Zipping folder:', targetDir)
      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        return res.status(404).json({ success: false, data: null, error: 'Folder not found' })
      }
      res.setHeader('Content-Type', 'application/zip')
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(targetDir)}.zip"`)
      const archive = archiver('zip', { zlib: { level: 9 } })
      archive.on('error', (err) => {
        res.status(500).end()
      })
      archive.pipe(res)
      archive.directory(targetDir, false)
      archive.finalize()
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, data: null, error: 'Failed to download folder' })
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

  /**
   * DELETE /api/files/:filename
   * Move a file to trash (soft delete)
   */
  @Delete('/:filename')
  @UseBefore(authenticate)
  async moveToTrash(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    if (!filename) {
      return res.status(400).json({ success: false, data: null, error: 'Filename required' })
    }
    const ok = moveUserFileToTrash(user.id, filename)
    if (ok) {
      return res.json({ success: true, data: { filename }, error: null })
    } else {
      return res.status(404).json({ success: false, data: null, error: 'File not found' })
    }
  }

  /**
   * GET /api/files/trash
   * List all trashed files for the authenticated user
   */
  @Get('/trash')
  @UseBefore(authenticate)
  async listTrash(@CurrentUser() user: User, @Res() res: Response) {
    const files = listUserTrashedFiles(user.id)
    return res.json({ success: true, data: files, error: null })
  }

  /**
   * POST /api/files/trash/restore
   * Restore a file from trash
   * Body: { filename: string }
   */
  @Post('/trash/restore')
  @UseBefore(authenticate)
  async restoreFromTrash(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const { filename } = req.body
    if (!filename) {
      return res.status(400).json({ success: false, data: null, error: 'Filename required' })
    }
    const ok = restoreUserFileFromTrash(user.id, filename)
    if (ok) {
      return res.json({ success: true, data: { filename }, error: null })
    } else {
      return res.status(404).json({ success: false, data: null, error: 'File not found in trash' })
    }
  }

  /**
   * DELETE /api/files/trash/:filename
   * Permanently delete a file from trash
   */
  @Delete('/trash/:filename')
  @UseBefore(authenticate)
  async deleteFromTrash(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Res() res: Response
  ) {
    if (!filename) {
      return res.status(400).json({ success: false, data: null, error: 'Filename required' })
    }
    const ok = deleteUserFileFromTrash(user.id, filename)
    if (ok) {
      return res.json({ success: true, data: { filename }, error: null })
    } else {
      return res.status(404).json({ success: false, data: null, error: 'File not found in trash' })
    }
  }
}
