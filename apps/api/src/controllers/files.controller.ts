import 'reflect-metadata'
import { JsonController, Get, Post, Param, Req, Res, UseBefore, Delete } from 'routing-controllers'
import type { Request, Response } from 'express'
import type { User } from '@repo/types'
import {
  saveUserFile,
  readUserFile,
  listUserTrashedFiles,
  restoreUserFileFromTrash,
  deleteUserFileFromTrash,
  batchMoveUserFilesToTrash
} from '@services/files.service'

import { z } from 'zod'
import { CurrentUser } from '../decorators/currentUser'
import multer from 'multer'
import { authenticate } from '@middleware/authenticate'
import fs from 'fs'
import path from 'path'
import { getStorageDir, listFolderContentsWithMetadataForContext } from '@utils/storageUtils'

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
    fileSize: 10000 * 1024 * 1024, // 100MB limit per file
    files: 10 // Maximum 10 files per request
  }
})

const fileSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(1, 'File size must be greater than 0')
})

const PERSONAL_WORKSPACE_ID = 'personal'

@JsonController('/files')
export default class UnifiedFilesController {
  /**
   * POST /api/files/batch
   * Upload multiple files for the authenticated user (encrypted for personal, unencrypted for workspace)
   */
  @Post('/batch')
  @UseBefore(authenticate)
  @UseBefore(upload.array('files'))
  async uploadFilesBatch(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, data: null, error: 'No files uploaded' })
    }

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    const results = []
    for (const file of req.files) {
      // Validate file using Zod schema
      const result = fileSchema.safeParse(file)
      if (!result.success) {
        results.push({ filename: file.originalname, success: false, error: result.error.message })
        continue
      }
      try {
        // Read file from disk
        const fileBuffer = fs.readFileSync(file.path)

        if (workspaceId === PERSONAL_WORKSPACE_ID) {
          // Use personal storage (client-side encrypted data)
          saveUserFile(fileBuffer, file.originalname, user.id)
        } else {
          // Use workspace storage without encryption
          const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
          const filePath = path.join(workspaceStorageDir, file.originalname)

          // Ensure workspace storage directory exists
          if (!fs.existsSync(workspaceStorageDir)) {
            fs.mkdirSync(workspaceStorageDir, { recursive: true })
          }

          fs.writeFileSync(filePath, fileBuffer)
        }

        // Clean up temporary file
        fs.unlinkSync(file.path)

        results.push({ filename: file.originalname, success: true, error: null })
      } catch (err: any) {
        // Clean up temporary file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path)
        }
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
  async listFiles(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    try {
      const filePath = typeof req.query.path === 'string' ? req.query.path : ''
      const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

      let items
      if (workspaceId === PERSONAL_WORKSPACE_ID) {
        // Use personal storage (existing encrypted storage)
        items = listFolderContentsWithMetadataForContext(user.id, 'personal', 'files', filePath)
      } else {
        // Use workspace storage (separate from user storage)
        const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
        const targetDir = filePath ? path.join(workspaceStorageDir, filePath) : workspaceStorageDir

        if (!fs.existsSync(targetDir)) {
          items = []
        } else {
          items = fs
            .readdirSync(targetDir)
            .filter((item) => item !== '.trash') // Hide .trash folder
            .map((item) => {
              const itemPath = path.join(targetDir, item)
              const stat = fs.statSync(itemPath)
              return {
                name: item,
                size: stat.isFile() ? stat.size : undefined,
                modified: stat.mtime,
                type: stat.isDirectory() ? ('folder' as const) : ('file' as const)
              }
            })
        }
      }

      return res.json({ success: true, data: items, error: null })
    } catch (e) {
      return res
        .status(500)
        .json({ success: false, data: null, error: 'Failed to list files/folders' })
    }
  }

  /**
   * GET /api/files/trash
   * List all trashed files for the authenticated user
   */
  @Get('/trash')
  @UseBefore(authenticate)
  async listTrash(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    let files
    if (workspaceId === PERSONAL_WORKSPACE_ID) {
      // Use personal storage trash
      files = listUserTrashedFiles(user.id)
    } else {
      // Use workspace storage trash
      const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
      const trashDir = path.join(workspaceStorageDir, '.trash')

      // Ensure storage and trash directories exist
      if (!fs.existsSync(workspaceStorageDir)) {
        fs.mkdirSync(workspaceStorageDir, { recursive: true })
      }
      if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true })
        files = []
      } else {
        try {
          files = fs.readdirSync(trashDir).map((f) => {
            const stat = fs.statSync(path.join(trashDir, f))
            return {
              filename: f,
              size: stat.size,
              modified: stat.mtime,
              type: stat.isDirectory() ? 'folder' : 'file'
            }
          })
        } catch (error) {
          files = []
        }
      }
    }

    return res.json({ success: true, data: files, error: null })
  }

  /**
   * GET /api/files/:filename
   * Download a specific file for the authenticated user (decrypted for personal, raw for workspace)
   */
  @Get('/:filename')
  @UseBefore(authenticate)
  async downloadFile(
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
        data = readUserFile(params.data.filename, user.id)
      } else {
        // Use workspace storage without decryption
        const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
        const filePath = path.join(workspaceStorageDir, params.data.filename)
        data = fs.readFileSync(filePath)
      }

      res.setHeader('Content-Disposition', `attachment; filename="${params.data.filename}"`)
      return res.send(data)
    } catch (e) {
      return res
        .status(404)
        .json({ success: false, data: null, error: 'File not found or decryption failed' })
    }
  }

  /**
   * POST /api/files/batch/trash
   * Move multiple files to trash
   */
  @Post('/batch/trash')
  @UseBefore(authenticate)
  async batchMoveToTrash(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const { filenames } = req.body
    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return res
        .status(400)
        .json({ success: false, data: null, error: 'Filenames array is required' })
    }

    let results
    if (workspaceId === PERSONAL_WORKSPACE_ID) {
      // Use personal storage trash
      results = batchMoveUserFilesToTrash(user.id, filenames)
    } else {
      // Use workspace storage trash
      const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
      const trashDir = path.join(workspaceStorageDir, '.trash')

      // Ensure storage and trash directories exist
      if (!fs.existsSync(workspaceStorageDir)) {
        fs.mkdirSync(workspaceStorageDir, { recursive: true })
      }
      if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true })
      }

      results = []
      for (const filename of filenames) {
        try {
          const filePath = path.join(workspaceStorageDir, filename)
          const trashPath = path.join(trashDir, filename)

          if (fs.existsSync(filePath)) {
            fs.renameSync(filePath, trashPath)
            results.push({ filename, success: true, error: null })
          } else {
            results.push({ filename, success: false, error: 'File not found' })
          }
        } catch (err: any) {
          results.push({ filename, success: false, error: err.message })
        }
      }
    }

    return res.json({ success: true, data: results, error: null })
  }

  /**
   * POST /api/files/trash/restore
   * Restore a file from trash
   */
  @Post('/trash/restore')
  @UseBefore(authenticate)
  async restoreFromTrash(@CurrentUser() user: User, @Req() req: Request, @Res() res: Response) {
    const { filename } = req.body
    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    if (!filename) {
      return res.status(400).json({ success: false, data: null, error: 'Filename required' })
    }

    let ok: boolean
    if (workspaceId === PERSONAL_WORKSPACE_ID) {
      // Use personal storage trash
      ok = restoreUserFileFromTrash(user.id, filename)
    } else {
      // Use workspace storage trash
      const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
      const trashDir = path.join(workspaceStorageDir, '.trash')
      const trashFilePath = path.join(trashDir, filename)
      const restoreFilePath = path.join(workspaceStorageDir, filename)

      // Ensure storage and trash directories exist
      if (!fs.existsSync(workspaceStorageDir)) {
        fs.mkdirSync(workspaceStorageDir, { recursive: true })
      }
      if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true })
      }

      if (fs.existsSync(trashFilePath)) {
        fs.renameSync(trashFilePath, restoreFilePath)
        ok = true
      } else {
        ok = false
      }
    }

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
    @Req() req: Request,
    @Res() res: Response
  ) {
    const paramSchema = z.object({ filename: z.string().min(1, 'Filename is required') })
    const params = paramSchema.safeParse({ filename })
    if (!params.success) {
      return res.status(400).json({ success: false, data: null, error: params.error.message })
    }

    const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

    let ok: boolean
    if (workspaceId === PERSONAL_WORKSPACE_ID) {
      // Use personal storage trash
      ok = deleteUserFileFromTrash(user.id, params.data.filename)
    } else {
      // Use workspace storage trash
      const workspaceStorageDir = path.join(getStorageDir(), 'workspaces', workspaceId, 'files')
      const trashDir = path.join(workspaceStorageDir, '.trash')
      const trashFilePath = path.join(trashDir, params.data.filename)

      // Ensure storage and trash directories exist
      if (!fs.existsSync(workspaceStorageDir)) {
        fs.mkdirSync(workspaceStorageDir, { recursive: true })
      }
      if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true })
      }

      if (fs.existsSync(trashFilePath)) {
        fs.unlinkSync(trashFilePath)
        ok = true
      } else {
        ok = false
      }
    }

    if (ok) {
      return res.json({ success: true, data: { filename: params.data.filename }, error: null })
    } else {
      return res.status(404).json({ success: false, data: null, error: 'File not found in trash' })
    }
  }
}
