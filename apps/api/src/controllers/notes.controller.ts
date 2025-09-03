import 'reflect-metadata'
import {
  JsonController,
  Get,
  Post,
  Param,
  Req,
  Res,
  UseBefore,
  Delete,
  Put
} from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import { saveNote, readNote } from '../services/notes.service'
import {
  listFilesForContext,
  getFilePathForContext,
  ensureStorageDirForContext
} from '@utils/storageUtils'

import { base64urlDecode } from '@repo/utils'
import { CurrentUser } from '../decorators/currentUser'
import { authenticate } from '@middleware/authenticate'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import {
  notesUpload,
  noteSchema,
  getWorkspaceContext,
  sendErrorResponse,
  sendSuccessResponse,
  sendValidationErrorResponse,
  sendNotFoundResponse
} from '../utils'

@JsonController('/notes')
export default class NotesController {
  /**
   * POST /api/notes
   * Upload a note for the authenticated user (personal or workspace context)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(notesUpload.single('note'))
  async uploadNote(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return sendErrorResponse(res, 'No note uploaded', 400)
    }

    const workspaceId = getWorkspaceContext(req.query)

    // Validate file using Zod schema
    const result = noteSchema.safeParse(req.file)
    if (!result.success) {
      return sendValidationErrorResponse(res, result.error)
    }

    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(req.file.path)

      if (workspaceId === 'personal') {
        // Use personal storage with encryption
        saveNote(fileBuffer, req.file.originalname, user.id)
      } else {
        // Use workspace storage (separate from user storage)
        const storageDir = ensureStorageDirForContext(user.id, workspaceId, 'notes')
        const filePath = path.join(storageDir, req.file.originalname)
        fs.writeFileSync(filePath, fileBuffer)
      }

      // Clean up temporary file
      fs.unlinkSync(req.file.path)

      return sendSuccessResponse(res, {
        filename: req.file.originalname,
        message: 'Note uploaded successfully'
      })
    } catch (err: any) {
      // Clean up temporary file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return sendErrorResponse(res, err.message, 500)
    }
  }

  /**
   * GET /api/notes
   * List all notes for the authenticated user (personal or workspace context)
   */
  @Get('/')
  @UseBefore(authenticate)
  async listNotes(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const workspaceId = getWorkspaceContext(req.query)

      let notes: string[]
      if (workspaceId === 'personal') {
        // Use personal storage (existing encrypted storage)
        notes = listFilesForContext(user.id, 'personal', 'notes')
      } else {
        // Use workspace storage (separate from user storage)
        notes = listFilesForContext(user.id, workspaceId, 'notes')
      }

      return sendSuccessResponse(res, notes)
    } catch (e) {
      return sendErrorResponse(res, 'Failed to list notes', 500)
    }
  }

  /**
   * GET /api/notes/:filename
   * Download a specific note for the authenticated user (personal or workspace context)
   */
  @Get('/:filename')
  @UseBefore(authenticate)
  async downloadNote(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const workspaceId = getWorkspaceContext(req.query)

    try {
      let data: Buffer
      if (workspaceId === 'personal') {
        // Use personal storage with decryption
        data = readNote(filename, user.id)
      } else {
        // Use workspace storage (separate from user storage)
        const filePath = getFilePathForContext(user.id, workspaceId, 'notes', filename)
        data = fs.readFileSync(filePath)
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(data)
    } catch (e) {
      return sendNotFoundResponse(res, 'Note not found or decryption failed')
    }
  }

  /**
   * PUT /api/notes/:filename/rename
   * Rename a note for the authenticated user (personal or workspace context)
   */
  @Put('/:filename/rename')
  @UseBefore(authenticate)
  async renameNote(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const paramSchema = z.object({ filename: z.string().min(1, 'Filename is required') })
    const params = paramSchema.safeParse({ filename })
    if (!params.success) {
      return res.status(400).json({ success: false, data: null, error: params.error.message })
    }

    const bodySchema = z.object({ newFilename: z.string().min(1, 'New filename is required') })
    const body = bodySchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, data: null, error: body.error.message })
    }

    const workspaceId = getWorkspaceContext(req.query)

    try {
      if (workspaceId === 'personal') {
        // Use personal storage with encryption
        const oldFilePath = getFilePathForContext(
          user.id,
          'personal',
          'notes',
          params.data.filename
        )
        const newFilePath = getFilePathForContext(
          user.id,
          'personal',
          'notes',
          body.data.newFilename
        )

        if (!fs.existsSync(oldFilePath)) {
          return res.status(404).json({ success: false, data: null, error: 'Note not found' })
        }

        if (fs.existsSync(newFilePath)) {
          return res
            .status(409)
            .json({ success: false, data: null, error: 'File with that name already exists' })
        }

        fs.renameSync(oldFilePath, newFilePath)
      } else {
        // Use workspace storage (separate from user storage)
        const oldFilePath = getFilePathForContext(
          user.id,
          workspaceId,
          'notes',
          params.data.filename
        )
        const newFilePath = getFilePathForContext(
          user.id,
          workspaceId,
          'notes',
          body.data.newFilename
        )

        if (!fs.existsSync(oldFilePath)) {
          return res.status(404).json({ success: false, data: null, error: 'Note not found' })
        }

        if (fs.existsSync(newFilePath)) {
          return res
            .status(409)
            .json({ success: false, data: null, error: 'File with that name already exists' })
        }

        fs.renameSync(oldFilePath, newFilePath)
      }

      return res.json({
        success: true,
        data: { filename: body.data.newFilename },
        error: null
      })
    } catch (e) {
      return res.status(500).json({ success: false, data: null, error: 'Failed to rename note' })
    }
  }

  /**
   * DELETE /api/notes/:filename
   * Delete a note for the authenticated user (personal or workspace context)
   */
  @Delete('/:filename')
  @UseBefore(authenticate)
  async deleteNote(
    @CurrentUser() user: User,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const paramSchema = z.object({ filename: z.string().min(1, 'Filename is required') })
    const params = paramSchema.safeParse({ filename })
    if (!params.success) {
      return res.status(400).json({ success: false, data: null, error: params.error.message })
    }

    const workspaceId = getWorkspaceContext(req.query)

    try {
      if (workspaceId === 'personal') {
        // Use personal storage with encryption
        const filePath = getFilePathForContext(user.id, 'personal', 'notes', params.data.filename)

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, data: null, error: 'Note not found' })
        }

        fs.unlinkSync(filePath)
      } else {
        // Use workspace storage (separate from user storage)
        const filePath = getFilePathForContext(user.id, workspaceId, 'notes', params.data.filename)

        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ success: false, data: null, error: 'Note not found' })
        }

        fs.unlinkSync(filePath)
      }

      return res.json({
        success: true,
        data: { filename: params.data.filename },
        error: null
      })
    } catch (e) {
      return res.status(500).json({ success: false, data: null, error: 'Failed to delete note' })
    }
  }
}
