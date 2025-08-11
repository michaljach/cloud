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
import { z } from 'zod'
import { CurrentUser } from '../decorators/currentUser'
import multer from 'multer'
import { authenticate } from '@middleware/authenticate'
import fs from 'fs'
import path from 'path'

// Special workspace ID for personal space
const PERSONAL_WORKSPACE_ID = 'personal'

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

const noteSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(0, 'File size must be non-negative')
})

@JsonController('/notes')
export default class NotesController {
  /**
   * POST /api/notes
   * Upload a note for the authenticated user (personal or workspace context)
   */
  @Post('/')
  @UseBefore(authenticate)
  @UseBefore(upload.single('note'))
  async uploadNote(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, error: 'No note uploaded' })
    }

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    // Validate file using Zod schema
    const result = noteSchema.safeParse(req.file)
    if (!result.success) {
      return res.status(400).json({ success: false, data: null, error: result.error.message })
    }

    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(req.file.path)

      if (workspaceId === PERSONAL_WORKSPACE_ID) {
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

      return res.json({
        success: true,
        data: { filename: req.file.originalname },
        error: null
      })
    } catch (err: any) {
      // Clean up temporary file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(500).json({ success: false, data: null, error: err.message })
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
      const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

      let notes: string[]
      if (workspaceId === PERSONAL_WORKSPACE_ID) {
        // Use personal storage (existing encrypted storage)
        notes = listFilesForContext(user.id, 'personal', 'notes')
      } else {
        // Use workspace storage (separate from user storage)
        notes = listFilesForContext(user.id, workspaceId, 'notes')
      }

      return res.json({ success: true, data: notes, error: null })
    } catch (e) {
      return res.status(500).json({ success: false, data: null, error: 'Failed to list notes' })
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
    const paramSchema = z.object({ filename: z.string().min(1, 'Filename is required') })
    const params = paramSchema.safeParse({ filename })
    if (!params.success) {
      return res.status(400).json({ success: false, data: null, error: params.error.message })
    }

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    try {
      let data: Buffer
      if (workspaceId === PERSONAL_WORKSPACE_ID) {
        // Use personal storage with decryption
        data = readNote(params.data.filename, user.id)
      } else {
        // Use workspace storage (separate from user storage)
        const filePath = getFilePathForContext(user.id, workspaceId, 'notes', params.data.filename)
        data = fs.readFileSync(filePath)
      }

      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'Note not found or decryption failed' })
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

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    try {
      if (workspaceId === PERSONAL_WORKSPACE_ID) {
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

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    try {
      if (workspaceId === PERSONAL_WORKSPACE_ID) {
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
