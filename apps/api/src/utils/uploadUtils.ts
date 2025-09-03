import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

// Common constants
export const PERSONAL_WORKSPACE_ID = 'personal'
export const UPLOADS_DIR = path.join(process.cwd(), 'uploads')

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// Common file validation schema
export const fileSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(1, 'File size must be greater than 0')
})

// Common note validation schema (allows 0 size for empty notes)
export const noteSchema = z.object({
  originalname: z.string().min(1, 'Filename is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().min(0, 'File size must be non-negative')
})

// Create multer upload configuration
export function createUploadConfig(options: {
  maxFileSize: number
  maxFiles: number
  singleFile?: boolean
}) {
  const { maxFileSize, maxFiles, singleFile = false } = options

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR)
      },
      filename: (req, file, cb) => {
        // Generate unique filename to avoid conflicts
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        cb(null, `${uniqueSuffix}-${file.originalname}`)
      }
    }),
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    }
  })
}

// Pre-configured upload configs for different use cases
export const filesUpload = createUploadConfig({
  maxFileSize: 10000 * 1024 * 1024, // 100MB
  maxFiles: 10
})

export const notesUpload = createUploadConfig({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 1,
  singleFile: true
})

export const photosUpload = createUploadConfig({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 1,
  singleFile: true
})

// Common file cleanup function
export function cleanupUploadedFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.warn(`Failed to cleanup uploaded file: ${filePath}`, error)
  }
}

// Common file reading function
export function readUploadedFile(filePath: string): Buffer {
  return fs.readFileSync(filePath)
}

// Common workspace context helper
export function getWorkspaceContext(query: any): string {
  return (query.workspaceId as string) || PERSONAL_WORKSPACE_ID
}

// Common file processing with cleanup
export function processUploadedFile<T>(
  file: Express.Multer.File,
  processor: (fileBuffer: Buffer, filename: string) => T
): T {
  try {
    const fileBuffer = readUploadedFile(file.path)
    const result = processor(fileBuffer, file.originalname)
    cleanupUploadedFile(file.path)
    return result
  } catch (error) {
    cleanupUploadedFile(file.path)
    throw error
  }
}
