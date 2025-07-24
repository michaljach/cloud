import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore, Delete } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import {
  encryptAndSaveUserFile,
  decryptAndReadUserFile,
  listUserFiles,
  listUserFolderContents,
  listUserTrashedFiles,
  restoreUserFileFromTrash,
  deleteUserFileFromTrash,
  batchMoveUserFilesToTrash,
  streamUserFolderAsZip
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
   * POST /api/files/batch
   * Upload multiple files for the authenticated user (encrypted)
   */
  @Post('/batch')
  @UseBefore(authenticate)
  @UseBefore(upload.array('files'))
  async uploadUserFilesBatch(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'No files uploaded' })
    }
    const results = []
    for (const file of req.files) {
      // Validate file using Zod schema
      const result = fileSchema.safeParse(file)
      if (!result.success) {
        results.push({ filename: file.originalname, success: false, error: result.error.message })
        continue
      }
      try {
        encryptAndSaveUserFile(file.buffer, file.originalname, user.id)
        results.push({ filename: file.originalname, success: true, error: null })
      } catch (err: any) {
        results.push({ filename: file.originalname, success: false, error: err.message })
      }
    }
    return res.json({
      success: true,
      data: results,
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
   * POST /api/files/batch-delete
   * Move multiple files to trash (soft delete)
   * Body: { filenames: string[] }
   */
  @Post('/batch-delete')
  @UseBefore(authenticate)
  async batchMoveToTrash(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const { filenames } = req.body
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'No filenames provided' })
    }
    const results = batchMoveUserFilesToTrash(user.id, filenames)
    return res.json({
      success: true,
      data: results,
      error: null
    })
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
